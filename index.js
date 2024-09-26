require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const db = require("./db.js");
const dns = require("dns");
const extractDomain = require("extract-domain");
var isUrl = require("is-url-http");
const { nanoid } = require("nanoid");
app.use(bodyParser.urlencoded({ extended: false }));
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use((req, res, next) => {
  console.log(req.method + " " + req.path + " - " + req.ip);
  next();
});

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", async (req, res, next) => {
  if (isUrl(req.body.url) === false) {
    res.send({ error: "invalid url" });
    next();
  } else {
    let domain = getDomain(req.body.url);
    const response = await verifyDomain(domain);
    if (response.hasOwnProperty("error")) {
      if (response.error.code == "ENOTFOUND") {
        res.send({ error: "Invalid Hostname" });
      } else {
        res.send({ error: response.error.code });
      }
    } else {
      try {
        let sUrl = await getUniqueUrl(); 
        let newDomain = await db.createAndSaveDomain({
          name: req.body.url,
          shortUrl: sUrl,
        });
        
        if(newDomain != 11000) {
          res.send({ original_url: req.body.url, short_url: newDomain.shortUrl });
        } else {
          let message = newDomain == 11000 ? "Donain already Exist.": "error code " + newDomain + " occured.";
          res.send({errors: message});
        }
      } catch (error) {
        console.error(error);
        res.send({ error: error });
      }
    }
    next();
  }
});

app.get("/api/shorturl/:short_url", async (req, res, next) => {
  try {
    let sUrl = req.params.short_url;
    let domain = await db.findOneByShortUrl(sUrl);
    let reDirectUrl = await domain.name;
    res.redirect(reDirectUrl);
    next();
  } catch (error) {
    console.error(error);
  }
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

const getUniqueUrl = async () => {
  try {
    let foundIt = false;
    let sUrl;
    let result;
    do {
      sUrl = nanoid(10);
      result = await db.findOneByShortUrl(sUrl);
      if (result === null) {
        foundIt = true;
      }
    } while (foundIt === false);
    return sUrl;
  } catch (error) {
    console.error("error: ", error);
  }
};

const getDomain = (url) => {
  try {
    let domain = extractDomain(url);
    return domain;
  } catch (error) {
    console.error("error: ", error);
  }
};

const verifyDomain = async (domain) => {
  try {
    const { addresses, family } = await lookupDomain(domain);
    return { addresses, family };
  } catch (error) {
    return { error };
  }
};

const lookupDomain = (hostname) => {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, addresses, family) => {
      if (err) {
        reject(err);
      } else {
        resolve({ addresses, family });
      }
    });
  });
};
