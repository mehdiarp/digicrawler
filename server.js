var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const puppeteer = require('puppeteer');
var MongoClient = require('mongodb').MongoClient;
var createUrl = "mongodb://WFrMDNn:qogIsyi6o1TgszD@h3.2kloud.ir:27018/test?authMechanism=DEFAULT&authSource=admin";
var mongoURL = "mongodb://WFrMDNn:qogIsyi6o1TgszD@h3.2kloud.ir:27018/digicrawler?authMechanism=DEFAULT&authSource=admin";

app.get('/', function (req, res) {
  res.render('index');
})

app.get('/searchSupplyCategory', function (req, res) {
  res.render('searchSupplyCategory');
})

app.post('/searchSupplyCategory', function (req, res) {
  var supplyCategory = req.body.supplyCategory;
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("digicrawler");
    dbo.collection("products").find({'supplyCategory' : supplyCategory}).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      res.render('searchSupplyCategory', {result : result});
      db.close();
    });
  });
})

app.get('/AddingProduct', function (req, res) {
  res.render('AddingProduct');
})

app.get('/mongoCreateDatabase', function(req, res){
  MongoClient.connect(createUrl, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
  });
});

app.get('/mongoCreateCollection', function(req, res){
    MongoClient.connect(mongoURL, function(err, db) {
    if (err) throw err;
    var dbo = db.db("digicrawler");
    dbo.createCollection("products", function(err, res) {
      if (err) throw err;
      console.log("Collection created!");
      db.close();
    });
  });
});


var categoryPages = ['/category-cell-phone-pouch-cover/',
                    '/category-beauty/','/category-car-accessory-parts/',
                    '/category-mens-apparel/','/category-video-audio-entertainment/',
                  '/book-and-media/publication/','/category-health-and-bathroom-tools/',
                  '/category-travel-accessories/'];
var pageNumberQuryString = "?pageno=2&sortby=4";

String.prototype.toEnglishDigits = function () {
    return this.replace(/[۰-۹]/g, function (w) {
        var persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return persian.indexOf(w);
    });
};

String.prototype.toInt = function () {
    return parseInt(this);
};

function sleeep() {
    // all the stuff you want to happen after that pause
    console.log('Let\'s got for next request');
}

app.get('/ok', function(req, res){
  var crawlerProductId = [];
  for (var i = 0; i < categoryPages.length; i++) {
    url = "https://www.digikala.com/search" + categoryPages[i];
    request(url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            $('.c-product-box').filter(function(){
              var data = $(this);
              for (var i = 0; i < data.length; i++) {
                var dkp = data[i].attribs['data-id'];
                crawlerProductId.push(data[i].attribs['data-id']);
                if(crawlerProductId.length == 577 ){
                  console.log("finished crawling the search pages");
                  break;
                }
                else {
                  url = "https://www.digikala.com/product/dkp-" + dkp;
                  request(url, function(error, response, html){
                      if(!error){
                          var $ = cheerio.load(html);
                          var tempProductData = {productId : dkp, productName : "", CategoryName : "", BrandName: "",productImage : "", price : ""}
                          $('.c-product').filter(function(){
                            var data = $(this);
                            tempProductData.productName = data.children('.c-product__info').children('.c-product__headline').children('.c-product__title').text().trim();
                            tempProductData.productImage = data.children('.c-product__gallery').children('.c-gallery').children('.c-gallery__item').children('.c-gallery__img').children('.js-gallery-img').attr('data-src');
                            tempProductData.brandName = data.children('.c-product__info').children('.c-product__attributes').children('.c-product__config').children('.c-product__directory').children('ul').children('li').eq(0).children().eq(1).text();;
                            tempProductData.categoryName = data.children('.c-product__info').children('.c-product__attributes').children('.c-product__config').children('.c-product__directory').children('ul').children('li').eq(1).children().eq(1).text();
                            tempProductData.price = data.children('.c-product__info').children('.c-product__attributes').children('.c-product__config').children('.c-price').children('.c-price__value').children('.js-price-value').text().trim().replace(/,/i, '').toEnglishDigits().toInt();
                            tempProductData.supplyCategory = i;
                            MongoClient.connect(mongoURL, function(err, db) {
                              if (err) throw err;
                              var dbo = db.db("digicrawler");
                              dbo.collection("products").insertOne(tempProductData, function(err, res) {
                                if (err) throw err;
                                console.log("1 document inserted");
                                db.close();
                              });
                            });
                          });
                      }
                  });
                }
              }
            });
        }
    });
    url = "https://www.digikala.com/search" + categoryPages[i]+pageNumberQuryString;
    request(url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            $('.c-product-box').filter(function(){
              var data = $(this);
              for (var i = 0; i < data.length; i++) {
                var dkp = data[i].attribs['data-id'];
                crawlerProductId.push(data[i].attribs['data-id']);
                if(crawlerProductId.length == 577 ){
                  console.log("finished crawling the search pages");
                }
                else {
                  url = "https://www.digikala.com/product/dkp-" + dkp;
                  request(url, function(error, response, html){
                      if(!error){
                          var $ = cheerio.load(html);
                          var tempProductData = {productId : dkp, productName : "", CategoryName : "", BrandName: "",productImage : "", price : ""}
                          $('.c-product').filter(function(){
                            var data = $(this);
                            tempProductData.productName = data.children('.c-product__info').children('.c-product__headline').children('.c-product__title').text().trim();
                            tempProductData.productImage = data.children('.c-product__gallery').children('.c-gallery').children('.c-gallery__item').children('.c-gallery__img').children('.js-gallery-img').attr('data-src');
                            tempProductData.brandName = data.children('.c-product__info').children('.c-product__attributes').children('.c-product__config').children('.c-product__directory').children('ul').children('li').eq(0).children().eq(1).text();;
                            tempProductData.categoryName = data.children('.c-product__info').children('.c-product__attributes').children('.c-product__config').children('.c-product__directory').children('ul').children('li').eq(1).children().eq(1).text();
                            tempProductData.price = data.children('.c-product__info').children('.c-product__attributes').children('.c-product__config').children('.c-price').children('.c-price__value').children('.js-price-value').text().trim().replace(/,/i, '').toEnglishDigits().toInt();
                            tempProductData.supplyCategory = i;
                            MongoClient.connect(mongoURL, function(err, db) {
                              if (err) throw err;
                              var dbo = db.db("digicrawler");
                              dbo.collection("products").insertOne(tempProductData, function(err, res) {
                                if (err) throw err;
                                console.log("1 document inserted");
                                db.close();
                              });
                            });
                          });
                      }
                  });
                }
              }
            });
        }
    });
  }
});

app.get('/fafa', function(req, res){
  console.log(crawlerProductId);
});



app.listen('8081')
//console.log('Magic happens on port 8081');
exports = module.exports = app;
