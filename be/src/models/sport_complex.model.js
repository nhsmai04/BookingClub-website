import mongoose from "mongoose";
import { removeVietnameseAccents } from "../utils/vietnamese.util.js";

const sportComplexSchema = new mongoose.Schema({
    owner_id:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Owner",
        required: true
    },
    name:{
        type: String,
        required: true,
    },
    name_en:{
        type: String,
        required: false,
    },
    address:{
        type: String,
        required: true
    },
    city:{
        type: String,
        required: true,
        index: true,
        match: [/^[a-zA-ZÀ-ỹ\s]+$/, "City contains invalid characters"]
    },
    district:{
        type: String,
        required: true,
        index: true,
        match: [/^[a-zA-Z0-9À-ỹ\s.,-]+$/, "District contains invalid characters"]
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
            },
        coordinates: {
            type: [Number], //[kinh độ, vĩ độ] = [longitude, latitude] = [lng, lat]
            required: true
            }
    },
    map_url: {
      type: String,
      default: "",
    },
    phone:{
        type: String,
        required: true,
        match: /^[0-9]{9,11}$/
    },
    sport_type:{
        type: String,
        enum: ["badminton", "football", "tennis", "basketball", "volleyball", "pickleball", "padel", "golf", "complex"],
        required: true
    },
    email:{
        type: String,
        default: null,
        match: [/\S+@\S+\.\S+/, "Email is invalid"]
    },
    slug:{
        type: String,
        required: true,
        unique: true
    },
    opening_hours:{
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Opening hours must be in format HH:mm"]
    },
    closing_hours:{
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Closing hours must be in format HH:mm"]
    },
    created_at:{
        type: Date,
        default: Date.now
    }
});

sportComplexSchema.pre('save', function() {
  if (this.name) {
    this.name_en = removeVietnameseAccents(this.name.trim());
  }
});

sportComplexSchema.pre('insertMany', function(next, docs) {
    docs.forEach(doc => {
        doc.name_en = removeVietnameseAccents(doc.name.trim());
    });
    next();
});   

sportComplexSchema.index({ name: 'text' });

sportComplexSchema.index({ city: 1, district: 1, name_en: 1 });

sportComplexSchema.index({ location: '2dsphere' });

export default mongoose.model("SportComplex", sportComplexSchema);