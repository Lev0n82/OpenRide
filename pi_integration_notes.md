# Pi Network SDK Integration Notes

## Key Findings

### Frontend SDK Integration
- Pi SDK is loaded via script tag in HTML: `<script src="https://sdk.minepi.com/pi-sdk.js"></script>`
- Access via `window.Pi` object
- Two main functions: `authenticate()` and `createPayment()`

### Authentication Flow
```javascript
Pi.authenticate(scopes, onIncompletePaymentFound)
  .then(auth => {
    // auth.accessToken - for API verification
    // auth.user.uid - app-specific user ID
    // auth.user.username - if username scope requested
  })
```

### Payment Flow
1. **Client initiates**: `Pi.createPayment(paymentData, callbacks)`
2. **Server approves**: `POST /v2/payments/{id}/approve` with API Key
3. **User approves**: In Pi Browser
4. **Server completes**: `POST /v2/payments/{id}/complete` with txid

### Backend API Endpoints
- Base URL: `https://api.minepi.com/v2`
- `/me` - Verify user (requires Bearer token)
- `/payments/{id}` - Get payment info (requires API Key)
- `/payments/{id}/approve` - Approve payment (requires API Key)
- `/payments/{id}/complete` - Complete payment (requires API Key)

### Authorization Methods
1. **Access Token**: `Authorization: Bearer <token>` (for user endpoints)
2. **API Key**: `Authorization: Key <api_key>` (for payment endpoints)

### Available Scopes
- `username` - Get user's Pi username
- `payments` - Create payments

### KYC Status
- User KYC status not directly exposed in SDK
- Must be checked via custom implementation or Pi Platform features

## Implementation Plan for OpenRide

1. Add Pi SDK script to HTML
2. Replace Manus OAuth with Pi authentication
3. Implement payment flow for ride fares
4. Store Pi uid as primary user identifier
5. Use Pi API Key for backend payment verification
6. Integrate RIDE token distribution after completed payments
