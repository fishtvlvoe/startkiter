## ADDED Requirements

### Requirement: Checkout calls gateways through a provider-agnostic CheckoutGateway interface

The system SHALL define a `CheckoutGateway` interface with `createPaymentSession` and `processRefund` methods. `PayUniOneTimeGateway`, a new Shopline gateway, and a new Stripe gateway SHALL each implement this interface. Checkout and refund call sites MUST reference the `CheckoutGateway` type, not a concrete gateway class.

#### Scenario: Checkout code depends on the interface, not a concrete gateway class

- **WHEN** POST /api/checkout calls `createPaymentSession`
- **THEN** the call site MUST reference the `CheckoutGateway` type, and switching the enabled gateway between PAYUNi, Shopline, and Stripe MUST NOT require changes to the call site

### Requirement: Successful payments from any enabled gateway trigger the shared invoice hook

The system SHALL call the existing gateway-agnostic invoice-trigger function after a successful payment notification from any of PAYUNi, Shopline, or Stripe, without duplicating invoice-issuance logic per gateway.

#### Scenario: Shopline payment success triggers the same invoice function as PAYUNi

- **WHEN** a Shopline payment-success webhook is processed and marks an order paid
- **THEN** the system MUST call the same shared invoice-trigger function that the PAYUNi payment-success webhook calls, using only the order id as input

### Requirement: Refunds are dispatched to the order's originating gateway before being marked locally

The system SHALL call the originating gateway's refund API (based on `Order.paymentGateway`) before marking an order as refunded in the database. If the gateway refund call fails, the order MUST NOT be marked as refunded.

#### Scenario: Refund succeeds only after the gateway confirms it

- **WHEN** an operator refunds an order whose `paymentGateway` is `shopline`
- **THEN** the system MUST call the Shopline refund API first, and only mark the order as refunded in the database if that call succeeds

#### Scenario: Gateway refund failure leaves the order unrefunded

- **WHEN** the originating gateway's refund API call fails
- **THEN** the order's status MUST remain unchanged and MUST NOT be marked as refunded
