const { GoogleAuth } = require('google-auth-library');
const { walletobjects } = require('@googleapis/walletobjects');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class GoogleWalletPass {
  constructor() {
    this.issuerId = process.env.WALLET_ISSUER_ID;

    this.credentials = {
      type: process.env.WALLET_TYPE,
      project_id: process.env.WALLET_PROJECT_ID,
      private_key_id: process.env.WALLET_PRIVATE_KEY_ID,
      private_key: process.env.WALLET_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.WALLET_CLIENT_EMAIL,
      client_id: process.env.WALLET_CLIENT_ID,
      auth_uri: process.env.WALLET_AUTH_URI,
      token_uri: process.env.WALLET_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.WALLET_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.WALLET_CLIENT_X509_CERT_URL,
      universe_domain: process.env.WALLET_UNIVERSE_DOMAIN,
    };

    const auth = new GoogleAuth({
      credentials: this.credentials,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    this.client = walletobjects({ version: 'v1', auth });
  }

  async createClass(classId) {
    const resourceId = `${this.issuerId}.${classId}`;

    try {
      await this.client.genericclass.get({ resourceId });
      console.log(`Class ${resourceId} already exists!`);
      return resourceId;
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        console.error('Error checking class:', err);
        return resourceId;
      }
    }

    const classPayload = {
      id: resourceId,
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              threeItems: {
                startItem: {
                  firstValue: { fields: [{ fieldPath: "object.textModulesData['group']" }] },
                },
                middleItem: {
                  firstValue: { fields: [{ fieldPath: "object.textModulesData['shirt_size']" }] },
                },
                endItem: {
                  firstValue: { fields: [{ fieldPath: "object.textModulesData['dietary']" }] },
                },
              },
            },
          ],
        },
      },
    };

    try {
      const res = await this.client.genericclass.insert({ requestBody: classPayload });
      console.log('Created generic class:', res.data.id || resourceId);
      return resourceId;
    } catch (err) {
      console.error('Error creating class:', err);
      throw err;
    }
  }

  async createObject(classId, objectId, objectData) {
    const resourceId = `${this.issuerId}.${objectId}`;

    try {
      await this.client.genericobject.get({ resourceId });
      console.log(`Object ${resourceId} already exists!`);
      return resourceId;
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        console.error('Error checking object:', err);
        return resourceId;
      }
    }

    const objectPayload = {
      id: resourceId,
      classId: `${this.issuerId}.${classId}`,
      logo: {
        sourceUri: { uri: objectData.logoUri },
        contentDescription: {
          defaultValue: { language: 'en-US', value: objectData.logoDescription || 'Logo' },
        },
      },
      cardTitle: { defaultValue: { language: 'en-US', value: 'F!rosh Week 2T5' } },
      header: { defaultValue: { language: 'en-US', value: objectData.header } },
      subheader: { defaultValue: { language: 'en-US', value: 'Name' } },
      textModulesData: objectData.textModulesData, // array of {id, header, body}
      barcode: { type: 'QR_CODE', value: objectData.barcode },
      hexBackgroundColor: '#3d0f58',
      heroImage: objectData.heroImage
        ? {
            sourceUri: { uri: objectData.heroImage.uri },
            contentDescription: {
              defaultValue: { language: 'en-US', value: objectData.heroImage.description },
            },
          }
        : undefined,
    };

    try {
      const res = await this.client.genericobject.insert({ requestBody: objectPayload });
      console.log('Created generic object:', res.data.id || resourceId);
      return resourceId;
    } catch (err) {
      console.error('Error creating object:', err);
      throw err;
    }
  }

  createJwtExistingObject(classId, objectId) {
    const claims = {
      iss: this.credentials.client_email,
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        genericObjects: [
          {
            id: `${this.issuerId}.${objectId}`,
            classId: `${this.issuerId}.${classId}`,
          },
        ],
      },
    };

    // Sign the JWT with your service account private key
    const token = jwt.sign(claims, this.credentials.private_key, { algorithm: 'RS256' });

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
    console.log('Add to Google Wallet link:', saveUrl);

    return saveUrl;
  }
}

module.exports = GoogleWalletPass;
