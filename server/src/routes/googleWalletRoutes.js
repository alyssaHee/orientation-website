const express = require('express');
const router = express.Router();
const GoogleWalletPass = require('../services/GoogleWalletPass');

const walletPass = new GoogleWalletPass();

router.post('/create-pass', async (req, res) => {
  try {
    const { _id, firstName, lastName, shirtSize, allergies } = req.body;

    const classSuffix = 'frosh';
    const objectSuffix = `user-${_id}`;

    await walletPass.createClass(classSuffix);

    await walletPass.createObject(classSuffix, objectSuffix, {
      textModulesData: [
        { id: 'name', body: firstName + ' ' + lastName },
        { id: 'shirt_size', body: shirtSize },
        { id: 'dietary', body: allergies },
      ],
      barcode: {
        type: 'QR_CODE',
        value: `PASS-${_id}`,
      },
    });

    const link = await walletPass.createJwtExistingObject(classSuffix, objectSuffix);

    res.json({ url: link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create pass' });
  }
});

module.exports = router;
