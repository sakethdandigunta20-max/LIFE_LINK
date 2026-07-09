const router = require("express").Router();
const ctrl = require("../controllers/donor.controller");
const { authenticate, authorize } = require("../middleware/auth");

// Donor Profile
router.get(
    "/me",
    authenticate,
    authorize("donor"),
    ctrl.getMyProfile
);

router.put(
    "/me",
    authenticate,
    authorize("donor"),
    ctrl.updateMyProfile
);

router.get(
    "/me/history",
    authenticate,
    authorize("donor"),
    ctrl.myDonationHistory
);

// List/Search Donors
// (Temporarily allowing donor role for testing)
router.get(
    "/",
    authenticate,
    authorize(
        "admin",
        "hospital",
        "bloodbank",
        "recipient",
        "donor"
    ),
    ctrl.listDonors
);

// Get Donor by ID
router.get(
    "/:id",
    authenticate,
    ctrl.getDonorById
);

module.exports = router;