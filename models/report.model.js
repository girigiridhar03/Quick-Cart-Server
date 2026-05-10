import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Review", "Product"],
    },
    targetedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetType",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "Inappropriate",
        "Spam",
        "Offensive",
        "Fake Review",
        "Offensive Language",
        "Wrong Information",
        "Counterfeit Product",
        "Dangerous Product",
        "Other",
      ],
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
reportSchema.index({ reportedBy: 1, targetId: 1 }, { unique: true });
const Report = mongoose.model("Report", reportSchema);

export default Report;
