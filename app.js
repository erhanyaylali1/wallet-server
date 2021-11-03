const express = require('express')
const jsdom = require("jsdom");
const got = require('got');
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
const port = 8080;
const { JSDOM } = jsdom;

app.get('/', async (req, res) => {
	
	const fundNames = ["YAY", "AFA", "AFT", "IPJ"];
    const cryptoNames = ["bitcoin", "ethereum", "binance-coin", "solana"];
    const shorts = ["YFAY-1", "AFA", "AFT", "IPJ", "BTC", "ETH", "BNB", "SOL"];
    const assets = [11, 10417, 19397, 525, 0.00232, 0.04277815, 0.34485902, 0.49, 0];
	const result = [];
	let htmlContents = [];

    const promises = [];

    fundNames.forEach((el) => promises.push(got(`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${el}`).then(res => new JSDOM(res.body))))

    cryptoNames.forEach((el) => promises.push(got(`https://coinmarketcap.com/currencies/${el}`).then(res => new JSDOM(res.body))))

    promises.push(got("https://www.bloomberght.com/doviz/dolar").then(res => new JSDOM(res.body)))

	await Promise.all(promises).then((values) => htmlContents = values);

    htmlContents.forEach((el, index) => {
        let name, currentPrice, dailyDifference;
        
        if(index < 4) {
            name = el.window.document.getElementById('MainContent_FormViewMainIndicators_LabelFund').textContent;	
            currentPrice = el.window.document.querySelectorAll('#MainContent_PanelInfo .main-indicators ul.top-list li')[0].querySelector("span").textContent.replace(",",".");	
            dailyDifference = el.window.document.querySelectorAll('#MainContent_PanelInfo .main-indicators ul.top-list li')[1].querySelector("span").textContent.slice(1).replace(",",".");
        } else if(index === htmlContents.length - 1) {
            name = "Dolar";	
            currentPrice = el.window.document.querySelector('.widget-interest-detail.type1 h1 span').textContent;
            dailyDifference = el.window.document.querySelector('.widget-interest-detail.type1 h1 span.bulk').textContent;	
            dailyDifference = dailyDifference.slice(0, 1) + dailyDifference.slice(2, dailyDifference.length)
        } else {
            name = el.window.document.querySelector('.sc-1q9q90x-0.jCInrl.h1').textContent.slice(0, -3);	
            currentPrice = el.window.document.querySelector('.priceValue').textContent.slice(1);	
            if(el.window.document.querySelector('.sc-15yy2pl-0.gEePkg')){
                dailyDifference = ''.concat(el.window.document.querySelector('.sc-15yy2pl-0.gEePkg').textContent.slice(0, -1));
            } else {   
                dailyDifference = '-'.concat(el.window.document.querySelector('.sc-15yy2pl-0.feeyND').textContent.slice(0, -1));
            }
        }
		result.push({ name, currentPrice, dailyDifference })
    });

    result.forEach((el, index) => {
        if(index < 4){
            el.asset = assets[index] * parseFloat(el.currentPrice).toFixed(2);
            el.short = shorts[index];
        } else if (index < 8) {
            el.asset = parseFloat(assets[index]) * parseFloat(el.currentPrice.replace(",","")) * parseFloat(result[8].currentPrice.replace(",","."))
            el.asset = parseFloat(el.asset).toFixed(2);
            el.short = shorts[index];
        }
        result[index] = el;
    })

    res.send(result);

});

app.listen(port, () => {
  	console.log(`Example app listening on port ${port}!`)
});