## ADDED Requirements

### Requirement: Checkout credentials prefer admin settings then env
POST /api/checkout MUST resolve PAYUNi credentials by reading encrypted admin settings first and falling back to PAYUNI_MERCHANT_ID, PAYUNI_HASH_KEY, PAYUNI_HASH_IV, and PAYUNI_API_URL when settings are empty, missing, or undecryptable. Invalid decrypt MUST NOT cause HTTP 500. If both sources lack merchantId, hashKey, or hashIV, the response MUST remain HTTP 503 with an explicit configuration error.

#### Scenario: Settings override env
- **WHEN** admin settings store merchantId FROM_SETTINGS and env PAYUNI_MERCHANT_ID is FROM_ENV and remaining keys are valid
- **THEN** the PAYUNi session MUST use merchantId FROM_SETTINGS

##### Example: settings win
- **GIVEN** settings merchantId=FROM_SETTINGS and env PAYUNI_MERCHANT_ID=FROM_ENV with valid hashKey and hashIV in settings
- **WHEN** a signed-in buyer calls POST /api/checkout
- **THEN** EncryptInfo construction MUST use FROM_SETTINGS not FROM_ENV

#### Scenario: Env used when settings empty
- **WHEN** no payuni settings row exists and env has a complete valid key set
- **THEN** POST /api/checkout MUST return HTTP 200 and MUST NOT return HTTP 503

#### Scenario: Corrupt ciphertext falls back
- **WHEN** the payuni settings ciphertext cannot be decrypted and env has a complete valid key set
- **THEN** POST /api/checkout MUST return HTTP 200 using env and MUST NOT return HTTP 500
