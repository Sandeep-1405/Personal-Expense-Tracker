const mongoose = require('mongoose');

const categories = new mongoose.Schema({
    name:String,
    type:String
});

const Categories = mongoose.model("Categories",categories);

module.exports = Categories;