const express = require('express')
const jsdom = require("jsdom");
const got = require('got');
const cors = require("cors");
const moment = require('moment');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const db = require('./config/db.js');
const auth = require("./middleware/auth");
const { Op } = require("sequelize");

require("dotenv").config();

const app = express();
const { JSDOM } = jsdom;

app.use(express.json());
app.use(cors());
db.sequelize.sync({ alter: false, force: false });

app.get('/get-user-table-data', auth, async (req, res) => {

    const user = await db.User.findOne({ 
        where: { 
            email: req.user.email 
        },
        include: [{ 
            model: db.Asset
        }]
    });

    const quantities = user.Assets.map(el => el.UserHasAsset.quantity)
    const shorts = user.Assets.map(el => el.short)
    const cryptos = user.Assets.filter(el => el.id < 16).map(el => el.name)
    const funds = user.Assets.filter(el => el.id >= 16).map(el => el.short)
    const crpytosIndex = cryptos.length;

    const result = [];      
	let htmlContents = [];
    const promises = [];

    cryptos.forEach((el) => promises.push(got(`https://coinmarketcap.com/currencies/${el}`).then(res => new JSDOM(res.body))))
    funds.forEach((el) => promises.push(got(`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${el}`).then(res => new JSDOM(res.body))))
    promises.push(got("https://www.bloomberght.com/doviz/dolar").then(res => new JSDOM(res.body)))

    await Promise.all(promises).then((values) => htmlContents = values);
    
    const date = moment().tz("Europe/Istanbul").format("DD/MM/YYYY");
    const getDateDatas = await db.UserTotalAsset.findAll({ where: { date, UserId: user.id } });

    htmlContents.forEach((el, index) => {
        let name, currentPrice, dailyDifference;
        if(index === htmlContents.length - 1) {
            name = "Dolar";	
            currentPrice = el.window.document.querySelector('.widget-interest-detail.type1 h1 span').textContent;
            dailyDifference = el.window.document.querySelector('.widget-interest-detail.type1 h1 span.bulk').textContent;	
            dailyDifference = dailyDifference.slice(0, 1) + dailyDifference.slice(2, dailyDifference.length)
        } else if(index >= crpytosIndex) {
            name = el.window.document.getElementById('MainContent_FormViewMainIndicators_LabelFund').textContent;	
            currentPrice = el.window.document.querySelectorAll('#MainContent_PanelInfo .main-indicators ul.top-list li')[0].querySelector("span").textContent.replace(",",".");	
            dailyDifference = el.window.document.querySelectorAll('#MainContent_PanelInfo .main-indicators ul.top-list li')[1].querySelector("span").textContent.slice(1).replace(",",".");
        } else {
            name = el.window.document.querySelector('.sc-1q9q90x-0.jCInrl.h1').textContent.slice(0, -3);	
            currentPrice = el.window.document.querySelector('.priceValue').textContent.slice(1).replace(",","");	
            if(el.window.document.querySelector('.sc-15yy2pl-0.gEePkg')){
                dailyDifference = ''.concat(el.window.document.querySelector('.sc-15yy2pl-0.gEePkg').textContent.slice(0, -1));
            } else {   
                dailyDifference = '-'.concat(el.window.document.querySelector('.sc-15yy2pl-0.feeyND').textContent.slice(0, -1));
            }
        }
		result.push({ name, currentPrice, dailyDifference })
    });

    let totalAssets = 0;
    result.forEach((el, index) => {
        if(index < crpytosIndex){
            el.asset = parseFloat(quantities[index]) * parseFloat(el.currentPrice)  * parseFloat(result[result.length - 1].currentPrice.replace(",","."));
            el.short = shorts[index];
            totalAssets += el.asset;
        } else if (index < result.length - 1) {
            el.asset = parseFloat(quantities[index]) * parseFloat(el.currentPrice.replace(",",""))
            el.short = shorts[index];
            totalAssets += parseFloat(el.asset);
        }
        result[index] = el;
    })

    if(getDateDatas.length === 0){
        const newTotalAsset = await db.UserTotalAsset.create({ totalAssets, date });
        await user.addTotalAssets(newTotalAsset)
    } else {
        for await (const el of getDateDatas){
            await el.destroy();
        }
        const newTotalAsset = await db.UserTotalAsset.create({ totalAssets, date });
        await user.addTotalAssets(newTotalAsset)
    }

    const history = await db.UserTotalAsset.findAll({ order: [ ['createdAt', 'DESC'] ], limit: 30, where: { UserId: user.id } })
    
    res.send({ result, quantities, totalAssets, history });

})

app.post('/register', async (req, res) => {

    try {

        const { name, email, password, selectedCryptos, selectedFunds } = req.body;
    
        if (!(email && password && name)) {
            res.status(400).send("All input is required");
        }
    
        const oldUser = await db.User.findOne({ where: { email } });
    
        if (oldUser !== null) {
          return res.status(409).send("User Already Exist. Please Login");
        }

        encryptedPassword = await bcrypt.hash(password, 10);
    
        const user = await db.User.create({
            name,
            email, 
            password: encryptedPassword,
        });

        
        let promises = [];
        let assets = [];

        selectedFunds.forEach(fund => promises.push(db.Asset.findOne({ where: { short: fund } })))
        selectedCryptos.forEach(coin => promises.push(db.Asset.findOne({ where: { name: coin } })))

	    await Promise.all(promises).then((values) => assets = values);
        
        promises = [];
        assets.forEach((el) => user.addAsset(el))

	    await Promise.all(promises).then((values) => assets = values);

        const token = await jwt.sign(
            { user_id: user.id, email },
            process.env.TOKEN_KEY
        );

        user.token = token;
        res.status(201).json({ ...user.dataValues, token });
      } catch (err) {
        res.status(400).send(err);
      }
    
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
    
        if (!(email && password)) {
          res.status(400).send("All input is required");
        }

        const user = await db.User.findOne({ where: { email }});
    
        if (user !== null) {

            if(await bcrypt.compare(password, user.password)) {

                const token = await jwt.sign(
                    { user_id: user.id, email },
                    process.env.TOKEN_KEY,
                );
                user.token = token;
                res.status(200).json({ ...user.dataValues, token });
            
            } else {
                res.send(404, { message: "Invalid Password" });
            }

        } else {
            res.send(404, { message: "Invalid Email" });
        }

      } catch (err) {
        console.log(err);
      }
    
})

app.get('/get-user-with-token', auth, async (req, res) => {

    const user = await db.User.findOne({ 
        where: { 
            email: req.user.email 
        }
    });
  
    const token = await jwt.sign(
        { user_id: user.id, email: user.email },
        process.env.TOKEN_KEY   
    );

    res.status(200).json({ ...user.dataValues, token });
})

app.get("/get-user-profile", auth, async (req, res) => {
    
    const user = await db.User.findOne({ 
        where: { 
            email: req.user.email 
        },
        include: [{ 
            model: db.Asset
        }]
    });

    if(user !== null) {
        res.status(200).send(user);
    } else {
        res.status(404).send("User Not Found!");
    }
    
});

app.post('/update-user-asset', auth, async (req, res) => {
    
    try {
        
        const user = await db.User.findOne({ 
            where: { 
                email: req.user.email 
            }
        });
    
        const rel = await db.UserHasAssetModel.findOne({
            where: {
                UserId: user.id,
                AssetId: req.body.id
            }
        })
    
        rel.quantity = req.body.quantity;
    
        await rel.save();
    
        res.status(201).send("Asset Updated");
    } catch (err) {
        res.status(400).send(err.message);
    }
})

app.post('/delete-user-asset', auth, async (req, res) => {  
    try {
        
        const user = await db.User.findOne({ 
            where: { 
                email: req.user.email 
            }
        });
    
        const rel = await db.UserHasAssetModel.findOne({
            where: {
                UserId: user.id,
                AssetId: req.body.id
            }
        })
        
        await rel.destroy();
    
        res.status(201).send("Asset Deleted");
    } catch (err) {
        res.status(400).send(err.message);
    }
})

app.get('/get-asset-user-has-not', auth, async (req, res) => {
    
    const user = await db.User.findOne({ 
        where: { 
            email: req.user.email 
        },
        include: [{ 
            model: db.Asset
        }]
    });

    const Ids = user.Assets.map((el) => el.id)

    const assets = await db.Asset.findAll({
        where: {
            id: {
                [Op.notIn]: Ids
            }
        }
    })

    res.status(201).send(assets)

})

app.post('/add-assets-to-user', auth, async (req, res) => {
    
    try {

        const user = await db.User.findOne({ 
            where: { 
                email: req.user.email 
            }
        });

        console.log(JSON.stringify(user, null, 4))
    
        let promises = [];
        let assets = [];
    
        req.body.ids.forEach(id => promises.push(db.Asset.findByPk(id)));
    
        await Promise.all(promises).then((values) => assets = values);
        
        promises = [];
        assets.forEach((el) => user.addAsset(el))
    
        await Promise.all(promises);
    
        res.status(201).send("Assets are successfully added!");

    } catch (err) {
        res.status(400).send(err.message);
    }

})

const port = 8080;
app.listen(port, () => {
  	console.log(`Example app listening on port ${port}!`)
});
