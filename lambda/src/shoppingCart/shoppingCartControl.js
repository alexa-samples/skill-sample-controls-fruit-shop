/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

const { ContainerControlProps, InputUtil, AcknowledgeInputAct, ContainerControl, ContainerControlState, ListControl, ListFormatting, Logger, NumberControl, SimplifiedIntent, NonUnderstandingAct, SimplifiedMVSIntent, Strings } = require('ask-sdk-controls');
const { generateProductListDocument } = require('./aplTemplates/productListAPL');
const { AddAnotherItemAct, ItemAddedAct, ItemRemovedAct, TellCartContentAct, ShowCartAct } = require('./shoppingCartActs');
const Constants = require('../constants');

const log = new Logger('FruitShopJS:ShoppingCartControl');

const { i18n } = require('../i18n');

class ShoppingCartControlState extends ContainerControlState {
    constructor() {
        super();
        this.items = [];
        this.askingToAddAnother = false;
        this.cartUpdatingComplete = false;
        this.productsToProcess = [];
    }
}

/*
 * TODO:
 *  - feature: remove by voice.
 *  - feature: select by voice ordinal. 'the second one'
 *  - feature: handle 'go back'
 *  - fix edge cases
 */

class ShoppingCartControl extends ContainerControl {
    /**
     *
     * @param {ContainerControlProps} props
     */
    constructor(props) {
        super(props);
        this.state = new ShoppingCartControlState();

        // The category control helps the user explore items but it is not critical to the business flow.
        // the user can bypass this if they like with voice.
        this.categoryControl = new ListControl(
            {
                id: 'category',
                slotType: 'Category',
                listItemIDs: Constants.categoryIds,
                validation: (state) => (Constants.categoryIds.includes(state.value) ? true : { reasonCode: 'CategoryIdNotMatch' }),
                interactionModel: {
                    targets: ['category'],
                    actions: {
                        set: [Strings.Action.Set, Strings.Action.Select, Strings.Action.Add]
                    }
                },
                prompts: {
                    requestValue: i18n.t('CATEGORY_CONTROL_REQUEST_VALUE'),
                    valueSet: '', // not required as the product control prompt provides implicit confirmation.
                    invalidValue: (act) => {
                        if (act.payload.reasonCode === 'CategoryIdNotMatch') {
                            return i18n.t('CATEGORY_CONTROL_CATEGORY_IDS_VALIDATION_FAIL');
                        }
                        return i18n.t('CATEGORY_CONTROL_GENERAL_VALIDATION_FAIL');
                    }
                },
                apl: {
                    requestValue: {
                        document: generateProductListDocument(),
                    }
                }
            }
        );

        // The product selector: what item are they added to their cart.
        this.productControl = new ListControl(
            {
                id: 'product',
                slotType: 'Product',
                interactionModel: {
                    targets: ['product'],
                    actions: {
                        set: [Strings.Action.Set, Strings.Action.Select, Strings.Action.Add]
                    }
                },
                listItemIDs: () => {
                    if (this.categoryControl.state.value === 'fruit') {
                        return Constants.fruitIds;
                    } else if (this.categoryControl.state.value === 'vegetable') {
                        return Constants.vegetableIds;
                    }
                    throw new Error('unknown category');
                },
                prompts: {
                    requestValue: (act) => {
                        if (this.categoryControl.state.value !== undefined) {
                            const category = i18n.t(this.categoryControl.state.value, { count: 0 });
                            const favorites = ListFormatting.format(act.payload.choicesFromActivePage.map((choice) => i18n.t(choice, { count: 0 })), i18n.t('AND'));

                            return i18n.t('PRODUCT_CONTROL_REQUEST_VALUE_WITH_CATEGORY', { category, favorites });
                        }
                        return i18n.t('PRODUCT_CONTROL_REQUEST_VALUE_WITHOUT_CATEGORY');
                    },
                    valueSet: '', //  prompt fragment not required here as the itemCountControl provides implicit confirmation.
                },
                apl: {
                    requestValue: {
                        document: generateProductListDocument(),
                    }
                }
            }
        );

        // The item count selector: how many of the product are they added to their cart.
        this.itemCountControl = new NumberControl(
            {
                id: 'itemCount',
                interactionModel: {
                    targets: ['count'],
                    // actions: { // TODO: enable this in number control.
                    //     set: ['set', 'add', 'select']
                    // }
                },
                validation: [
                    (state) => state.value > 0 || { reasonCode: 'NEGATIVE' },
                    (state) => state.value <= 100 || { reasonCode: 'TOO_LARGE' }
                ],
                confirmationRequired: (state) => state.value >= 10,
                prompts: {
                    valueSet: 'OK.',
                    requestValue: (act) => {
                        const itemText = i18n.t(this.productControl.state.value, { count: 0 });
                        return (this.categoryControl.state.value
                            ? i18n.t('ITEM_COUNT_CONTROL_REQUEST_VALUE_WITH_PRODUCT', { itemText })
                            : i18n.t('ITEM_COUNT_CONTROL_REQUEST_VALUE_WITHOUT_PRODUCT'));
                    },
                    invalidValue: i18n.t('ITEM_COUNT_CONTROL_INVALID_VALUE')
                }
            }
        );
        this.addChild(this.categoryControl)
            .addChild(this.productControl)
            .addChild(this.itemCountControl);
    }

    async canHandle(input) {
        return this.isAddItemIntent(input)
            || this.isAddProductIntent(input)
            || this.isCheckCartIntent(input)
            || this.isResponseToWantingAnotherItemQuestion(input)
            || this.isClickOnCartItem(input)
            || await this.canHandleByChild(input) // @TODO: should be ok at top, but NumberControl catches YesIntent
            || this.isFallback(input); // test fallback after children given a chance
    }

    async handle(input, resultBuilder) {
        try {
            log.info('ShoppingCartControl.handle(): entering.');

            // Standard pattern: if one of our canHandle clauses passed, call its handle method. Otherwise delegate to the winning child.
            if (this.handleFunc) {
                await this.handleFunc(input, resultBuilder);
            } else {
                await this.handleByChild(input, resultBuilder);
            }

            // -------------
            log.info('Consumption of input complete. Running the cart\'s business logic ...');

            // If the user is manipulating the product, clear out the number selector.
            if (this.state.lastHandlingControl && this.state.lastHandlingControl.controlId === this.productControl.id) {
                this.itemCountControl.clear();
            }

            if ((this.categoryControl.state.value !== undefined
                || this.productControl.state.value !== undefined
                || this.itemCountControl.state.value !== undefined)) {
                // We may have thought we were done but the user is interacting with the cart so clearly we are not complete.
                // (for example, after completing cart but then user starts added more items.)
                this.state.cartUpdatingComplete = false;
            }

            this.ensureCategoryMatchesProduct();

            // this will not be necessary when control.isReady() in implemented by all controls.
            if (resultBuilder.hasInitiativeAct()) {
                return;
            }

            // Are we ready to commit a shopping item
            if (this.productControl.state.value !== undefined && this.itemCountControl.state.value !== undefined) { // TODO: introduce control.isReady()
                const item = { productId: this.productControl.state.value, count: this.itemCountControl.state.value };
                resultBuilder.addAct(new ItemAddedAct(this, item));
                log.info(`Added item (${item.productId}, ${item.count})`);
                this.state.items.push(item);

                // After added one item, do some state clear to make control is ready for add another item
                this.clearStates();

                if (this.state.productsToProcess.length > 0) {
                    this.popPendingProduct();
                } else {
                    // would you like another?
                    resultBuilder.addAct(new AddAnotherItemAct(this));
                    this.state.askingToAddAnother = true;
                    // show the cart
                    resultBuilder.addAct(new ShowCartAct(this, this.state.items));
                }
            }
        } finally {
            log.info('ShoppingCartControl.handle(): exiting.');
        }
    }

    /**
     * The category can get out-of-sync with the product if the user isn't using
     * the screen.  The product is the primary information, and so we force the
     * category to match up.
     */
    ensureCategoryMatchesProduct() {
        if (!this.productControl.state.value) {
            return;
        }

        if (Constants.fruitIds.includes(this.productControl.state.value)) {
            this.categoryControl.state.value = 'fruit';
        } else if (Constants.vegetableIds.includes(this.productControl.state.value)) {
            this.categoryControl.state.value = 'vegetable';
        }
        else {
            throw new Error(`productId is unknown: ${this.productControl.state.value}`);
        }
    }

    isResponseToWantingAnotherItemQuestion(input) {
        if (!this.state.askingToAddAnother) {
            return false;
        } else if (InputUtil.isBareYes(input)) {
            this.handleFunc = this.handleYesToWantingAnotherItem;
            return true;
        } else if (InputUtil.isBareNo(input)) {
            this.handleFunc = this.handleNoToWantingAnotherItem;
            return true;
        }
        return false;
    }

    handleYesToWantingAnotherItem(input, resultBuilder) {
        resultBuilder.addAct(new AcknowledgeInputAct(this));

        this.state.askingToAddAnother = false;
        this.state.cartUpdatingComplete = false;
        this.clearStates(); // prepare to ask about next item
        // We could explicitly ask children to generate a question here, but the generate-question-phase will do it for us.
    }

    handleNoToWantingAnotherItem(input, resultBuilder) {
        resultBuilder.addAct(new AcknowledgeInputAct(this));
        this.state.cartUpdatingComplete = true;
    }

    isCheckCartIntent(input) {
        const result = input.request.type === 'IntentRequest' && input.request.intent.name === 'CheckCartIntent';
        if (result) { this.handleFunc = this.handleCheckCartIntent; }
        return result;
    }

    handleCheckCartIntent(input, resultBuilder) {
        resultBuilder.addAct(new TellCartContentAct(this, this.state.items));
        resultBuilder.addAct(new AddAnotherItemAct(this));
        this.state.askingToAddAnother = true;
    }

    isAddItemIntent(input) {
        const result = input.request.type === 'IntentRequest' && input.request.intent.name === 'AddItemIntent';
        if (result) { this.handleFunc = this.handleAddItemIntent; }
        return result;
    }

    handleAddItemIntent(input) {
        const intent = SimplifiedIntent.fromIntent(input.request.intent);

        const productSlotResolution = intent.slotResolutions.product;
        const itemCountSlotResolution = intent.slotResolutions.count;

        if (!(productSlotResolution && itemCountSlotResolution)) {
            throw new Error('Unexpected. AddItemIntents received, but slots were not filled in');
        }

        // poke data into children

        this.productControl.setValue(productSlotResolution.slotValue, productSlotResolution.isEntityResolutionMatch);
        this.itemCountControl.setValue(Number.parseInt(itemCountSlotResolution.slotValue, 10)); // NumberControl does not have erMatch state yet.
        // then check if either child needs to ask a question about the values (invalid/unexpected/etc)
        /*
         * ! Blocker! NumberControl needs to be refactored to include testing of invalid/unexpected in canTakeInitiative.
         * until that is fixed, A direct AddItemIntent will bypass the checks.
         */
    }

    isAddProductIntent(input) {
        const result = input.request.type === 'IntentRequest' && input.request.intent.name === 'AddProductIntent';
        if (result) { this.handleFunc = this.handleAddProductIntent; }
        return result;
    }

    handleAddProductIntent(input) {
        const intent = SimplifiedMVSIntent.fromIntent(input.request.intent);
        const productOrList = intent.slotResolutions.product;
        if (Array.isArray(productOrList)) {
            log.info(`multi-value slot: ${productOrList.join(' <and> ')}`);
            this.state.productsToProcess.push(...productOrList);
        } else {
            log.info('single-value slot');
            this.state.productsToProcess.push(productOrList);
        }
        if (this.productControl.state.value === undefined) {
            this.popPendingProduct(input);
        }
    }

    popPendingProduct(input) {
        if (this.state.productsToProcess.length > 0) {
            // UX: if we are talking about the number of some product and user adds a product, ignore the current topic.
            const slotObject = this.state.productsToProcess.shift();
            this.productControl.setValue(slotObject.slotValue, slotObject.EntityResolution);
            this.ensureCategoryMatchesProduct();
            this.itemCountControl.clear();
        }
    }

    isClickOnCartItem(input) {
        const result = input.request.type === 'Alexa.Presentation.APL.UserEvent'
            && input.request.arguments
            && input.request.arguments[0] === this.id;
        if (result) { this.handleFunc = this.handleClickOnCartItem; }
        return result;
    }

    handleClickOnCartItem(input, resultBuilder) {
        const ordinal = input.request.arguments[1];
        const removedItem = this.state.items.splice(ordinal - 1, 1); // remove the clicked item.
        resultBuilder.addAct(new ItemRemovedAct(this, removedItem[0]));
        resultBuilder.addAct(new ShowCartAct(this, this.state.items));
    }

    isFallback(input) {
        const result = InputUtil.isFallbackIntent(input);
        if (result) { this.handleFunc = this.handleFallback; }
        return result;
    }

    handleFallback(input, resultBuilder) {
        // This is only here in order to demonstrate per-Control handling of FallbackIntent
        // Since we are not doing anything particularly special, a LiteralContentAct
        resultBuilder.addAct(new NonUnderstandingAct(this));
    }

    async canTakeInitiative(input) {
        // Don't ask a question if user is done with the cart, but otherwise let children ask a question.
        if (this.state.cartUpdatingComplete) {
            log.info('ShoppingCartControl.canTakeInitiative(): returning false as state.cartUpdatingComplete = true');
            return false;
        }
        return this.canTakeInitiativeByChild(input);
    }

    async takeInitiative(input, resultBuilder) {
        return this.takeInitiativeByChild(input, resultBuilder);
    }

    stringifyStateForDiagram() {
        return `${this.state.items.length} items; askingForAnother: ${this.state.askingToAddAnother},`
            + ` cartUpdateComplete:${this.state.cartUpdatingComplete}`;
    }

    // Function used to clear out this and children's state. Gets ready to collect another item from user.
    clearStates() {
        this.categoryControl.clear();
        this.productControl.clear();
        this.itemCountControl.clear();
        this.state.lastHandlingControl = undefined;
        this.state.lastInitiativeChild = undefined;
    }

    renderAct(act, input, responseBuilder) {
        if (act instanceof NonUnderstandingAct) {
            log.debug('ShoppingCartControl is handling this specific FallbackIntent / NonUnderstandingAct');
            responseBuilder.addPromptFragment(i18n.t('SHOPPING_CART_CONTROL_NON_UNDERSTANDING'));
            return;
        }
        super.renderAct(act, input, responseBuilder);
    }
}

module.exports = {
    ShoppingCartControl,
    ShoppingCartControlState,
};
