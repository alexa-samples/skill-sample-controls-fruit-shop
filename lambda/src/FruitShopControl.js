/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

const { ContainerControl, ContainerControlProps, ControlInput, InputUtil, ControlResultBuilder, LiteralContentAct, NonUnderstandingAct, Logger } = require('ask-sdk-controls');

const { ShoppingCartControl } = require('./shoppingCart/shoppingCartControl');
const { CheckoutControl } = require('./checkout/checkoutControl');

const { i18n } = require('./i18n');

const log = new Logger('FruitShopJS:FruitShopControl');

/**
 * The root control for the application.
 *
 * For FruitShop, the root Control is a container control with two child controls (that have children of their own).
 * The coding patterns shown here are a good template but also see {@link ShoppingCartControl} which shows some variations.
 * 1. Define the child controls as properties and add them as children in the constructor.
 * 2. Implement `canHandle()` as a ladder of logic that tests predicates, records the appropriate `handleFunction` and
 *    returns the boolean result.
 * 3. Implement `handle()` as a simple delegation to `this.handleFunction`.
 */
class FruitShopControl extends ContainerControl {
    /**
     * Constructs a new instance of the FruitShopControl
     *
     * @param {ContainerControlProps} props
     */
    constructor(props) {
        super(props);
        this.handleFunc = undefined;

        this.cartControl = new ShoppingCartControl({ id: 'cart' });
        this.deliveryControl = new CheckoutControl({ id: 'delivery' });

        this.addChild(this.cartControl)
            .addChild(this.deliveryControl);

    }

    /**
     * Determines if this control can handle the input either directly or via delegation.
     *
     * Since this is the root Control, this function determines if the *skill as a whole* can handle the input.
     * @param {ControlInput} input
     */
    async canHandle(input) {
        if (await this.canHandleByChild(input)) { // NOTE: The await is important (and easy to forget)
            this.handleFunc = this.handleByChild;
            return true;
        }
        else if (InputUtil.isLaunchRequest(input)) {
            this.handleFunc = this.handleLaunchRequest;
            return true;
        }
        else if (InputUtil.isSessionEndedRequest(input)) {
            this.handleFunc = this.handleSessionEndedRequest;
            return true;
        }
        else if (InputUtil.isFallbackIntent(input)) {
            this.handleFunc = this.handleFallbackIntent;
            return true;
        }
        else if (input.request.type === 'IntentRequest' && input.request.intent.name === 'AMAZON.CancelIntent') {
            this.handleFunc = this.handleCancelIntent;
            return true;
        }
        else if (input.request.type === 'IntentRequest' && input.request.intent.name === 'AMAZON.StopIntent') {
            this.handleFunc = this.handleStopIntent;
            return true;
        }
        else if (input.request.type === 'IntentRequest' && input.request.intent.name === 'AMAZON.HelpIntent') {
            this.handleFunc = this.handleHelpIntent;
            return true;
        }
        log.warn('Nothing wants this input. A new clause may be required.');
        return false;
    }

    /**
     * Handle the input
     *
     * This implementation assumes that canHandle() has returned true and that it set `this.handleFunc` appropriately
     *
     * @param {ControlInput} input
     * @param {ControlResultBuilder} resultBuilder
     */
    async handle(input, resultBuilder) {
        await this.handleFunc(input, resultBuilder);
    }

    async handleLaunchRequest(input, resultBuilder) {
        resultBuilder.addAct(new LiteralContentAct(this, { promptFragment: i18n.t('WELCOME_MSG') }));
    }

    async handleSessionEndedRequest(input, resultBuilder) {
        resultBuilder.endSession();
    }

    async handleCancelIntent(input, resultBuilder) {
        resultBuilder.endSession();
    }

    async handleStopIntent(input, resultBuilder) {
        resultBuilder.endSession();
    }

    async handleHelpIntent(input, resultBuilder) {
        resultBuilder.addAct(new LiteralContentAct(this, { promptFragment: i18n.t('WELCOME_MSG') }));
    }

    async handleFallbackIntent(input, resultBuilder) {
        resultBuilder.addAct(new NonUnderstandingAct(this));
    }

    async decideHandlingChild(candidates, input) {
        // always decide in favor of the cart as checkout only makes sense when the cart is complete.
        // expect for the special-case of FallbackIntent. (see super.decideHandlingChild())
        return !InputUtil.isFallbackIntent(input) && candidates.includes(this.cartControl)
            ? this.cartControl
            : super.decideHandlingChild(candidates, input);
    }

    async decideInitiativeChild(candidates, input) {
        // always decide in favor of the cart as checkout only makes sense when the cart is complete.
        return candidates.includes(this.cartControl) ? this.cartControl : super.decideHandlingChild(candidates, input);
    }

    renderAct(act, input, responseBuilder) {
        if (act instanceof NonUnderstandingAct) {
            log.debug('FruitShopControl is handling this specific FallbackIntent / NonUnderstandingAct');
            responseBuilder.addPromptFragment(i18n.t('FRUIT_SHOP_CONTROL_NON_UNDERSTANDING'));
            return;
        }
        super.renderAct(act, input, responseBuilder);
    }
}

exports.FruitShopControl = FruitShopControl;
