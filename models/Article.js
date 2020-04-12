var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
var ArticleSchema = new Schema({
    headline: {
        type: String,
        unique: true,
    },
    url: {
        type: String,
    },
    image: {
        type: String,
    },
    summary: {
        type: String,
    },
});

// This creates our model from the above schema, using mongoose's model method
var Articles = mongoose.model("Articles", ArticleSchema);

// Export the User model
module.exports = Articles;
