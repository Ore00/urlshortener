const mongoose = require('mongoose');
const mySecret = process.env['MONGO_URI'];
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true
  }
});

const Domain = mongoose.model('Domain', domainSchema);

const createAndSaveDomain = async (data) => {

  let domain = new Domain({
    name: data.name,
    shortUrl: data.shortUrl
  });
  try {
    let result = await domain.save();
    return result;
  } catch (err) {
    return err.code;
  }
};

const findDomainById = (domainId, done) => {
  Domain.findById(domainId, (err, data) => {
    if (err) return console.error(err);
    done(null, data);
  });
};

const findOneByShortUrl = (shortUrl) => {
  let domain = Domain.findOne({ shortUrl: shortUrl }).catch(err => console.error(err));
  return domain;
};

exports.DomainModel = Domain;
exports.createAndSaveDomain = createAndSaveDomain;
exports.findOneByShortUrl = findOneByShortUrl;
exports.findDomainById = findDomainById;