const logger = require("firebase-functions/logger");

class StripeService {
    constructor() {
        this._stripe = null;
    }

    getStripe(secretKey) {
        let key = secretKey || process.env.STRIPE_SECRET_KEY;

        // If we already have a real instance with this key, return it
        if (this._stripe && this._stripeKey === key) {
            return this._stripe;
        }

        if (!key || key.startsWith('placeholder') || key.includes('_KEY')) {
            logger.warn(`Invalid Stripe secret key format: ${key}. Using placeholder for build analysis.`);
            return require('stripe')('placeholder_key_for_build');
        }

        // Initialize and cache real instance
        this._stripe = require('stripe')(key);
        this._stripeKey = key;
        return this._stripe;
    }

    /**
     * Create a Stripe Checkout Session for a subscription.
     */
    async createCheckoutSession({ tenantId, customerEmail, priceId, successUrl, cancelUrl, secretKey }) {
        try {
            const stripe = this.getStripe(secretKey);

            // Find or update customer with tenantId metadata
            let customer;
            const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
            if (customers.data.length > 0) {
                customer = customers.data[0];
                if (customer.metadata.tenantId !== tenantId) {
                    await stripe.customers.update(customer.id, {
                        metadata: { tenantId }
                    });
                }
            } else {
                customer = await stripe.customers.create({
                    email: customerEmail,
                    metadata: { tenantId }
                });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                customer: customer.id,
                success_url: successUrl,
                cancel_url: cancelUrl,
                client_reference_id: tenantId,
                metadata: {
                    tenantId: tenantId
                },
                subscription_data: {
                    metadata: {
                        tenantId: tenantId
                    }
                }
            });

            return session;
        } catch (error) {
            logger.error("Error creating Stripe checkout session:", error);
            throw error;
        }
    }

    /**
     * Construct and verify a Stripe webhook event.
     */
    constructEvent(payload, sig, endpointSecret, secretKey) {
        return this.getStripe(secretKey).webhooks.constructEvent(payload, sig, endpointSecret);
    }

    /**
     * Fetch price and product details from Stripe.
     */
    async getPriceDetails(priceId, secretKey) {
        try {
            const stripe = this.getStripe(secretKey);
            const price = await stripe.prices.retrieve(priceId, {
                expand: ['product']
            });
            return {
                id: price.id,
                amount: price.unit_amount / 100,
                currency: price.currency,
                productName: price.product.name,
                productDescription: price.product.description,
                interval: price.recurring?.interval || 'one-time'
            };
        } catch (error) {
            logger.error("Error fetching price details:", error);
            throw error;
        }
    }
    /**
     * Fetch multiple prices and products details from Stripe in parallel.
     */
    async getPricesDetails(priceIds, secretKey) {
        try {
            const stripe = this.getStripe(secretKey);
            const promises = priceIds.map(id =>
                stripe.prices.retrieve(id, { expand: ['product'] })
            );

            const prices = await Promise.all(promises);

            return prices.map(price => ({
                id: price.id,
                amount: price.unit_amount / 100,
                currency: price.currency,
                productName: price.product.name,
                productDescription: price.product.description,
                interval: price.recurring?.interval || 'one-time'
            }));
        } catch (error) {
            logger.error("Error fetching multiple price details:", error);
            throw error;
        }
    }

    /**
     * List all active subscription prices from Stripe.
     */
    async listActivePrices(secretKey) {
        try {
            const stripe = this.getStripe(secretKey);
            const prices = await stripe.prices.list({
                active: true,
                type: 'recurring',
                expand: ['data.product'],
                limit: 10
            });

            return prices.data.map(price => ({
                id: price.id,
                amount: price.unit_amount / 100,
                currency: price.currency,
                productName: price.product.name,
                productDescription: price.product.description,
                interval: price.recurring?.interval || 'one-time'
            }));
        } catch (error) {
            logger.error("Error listing active prices:", error);
            throw error;
        }
    }

    /**
     * Fetch all invoices for a customer.
     */
    async getInvoices(customerId, secretKey) {
        try {
            const stripe = this.getStripe(secretKey);
            const invoices = await stripe.invoices.list({
                customer: customerId,
                limit: 10
            });
            return invoices.data.map(inv => ({
                id: inv.id,
                amount: inv.total / 100,
                status: inv.status,
                currency: inv.currency,
                date: inv.created,
                pdf: inv.invoice_pdf,
                number: inv.number
            }));
        } catch (error) {
            logger.error("Error fetching invoices:", error);
            throw error;
        }
    }
}

module.exports = new StripeService();
