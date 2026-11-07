const moongose = require("mongoose");
const taskSchema = new moongose.Schema({

userID: {
    type: moongose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "userID must be provided"],
  },
name: {
    type: String,
    required: [true, "name must be provided"],
    minlength: [3, "name must be at least 3 characters"],
    maxlength: [30, "name must be at most 30 characters"],
    trim: true,
  },

  description: {
    type: String,
    required: [true, "description must be provided"],
    minlength: [3, "description must be at least 3 characters"],
    maxlength: [100, "description must be at most 100 characters"],
    trim: true,
  },
  status: {
    type: String,
    enum: {
        values: ["pending", "in progress", "completed", "cancelled"],
        message: "status must be either pending, in progress, completed or cancelled",
    },
    default: "pending",
  },
  priority: {
    type: String,
    enum: {
        values: ["low", "medium", "high"],
        message: "priority must be either low, medium or high",
    },
    default: "medium",
  },
  dueDate: {
    type: Date,
    required: [true, "dueDate must be provided"],
    validate: {
        validator: function(value) {
            return !value || value > new Date();
        },
        message: "dueDate must be a future date",
    },
    completedDate: {
        type: Date,
        default: null
    }
  
  },
    timestamps: true,
    collection: "Tasks",
})
 taskSchema.index({ name: 1, status: 1 , priority: 1 }, { unique: true });
 module.exports = moongose.model("Task", taskSchema);