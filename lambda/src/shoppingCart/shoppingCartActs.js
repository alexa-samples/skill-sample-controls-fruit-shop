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

const { getSupportedInterfaces } = require('ask-sdk-core');
const { ListFormatting, ContentAct, InitiativeAct, Logger } = require('ask-sdk-controls');
const { generateCartListDocument } = require('./aplTemplates/shoppingCartAPL');

const log = new Logger('FruitShopJS:ShoppingCartActs');

const { i18n } = require('../i18n');

/**
 * Passive confirmation of an item being added
 */
class ItemAddedAct extends ContentAct {
    constructor(control, item) {
        super(control);
        this.item = item;
    }

    render(input, responseBuilder) {
        log.info('ItemAddedAct: rendering...');
        const itemText = renderItem(this.item);

        responseBuilder.addPromptFragment(
            i18n.t('SHOPPING_CART_CONTROL_ITEM_ADDED', { itemText })
        );
    }
}

/**
 * Ask the user if they want to add another item
 */
class AddAnotherItemAct extends InitiativeAct {
    render(input, responseBuilder) {
        log.info('AddAnotherItemAct: rendering...');
        responseBuilder.addPromptFragment(i18n.t('SHOPPING_CART_CONTROL_ADD_ANOTHER_ITEM'));
    }
}

/**
 * Tell the user what is in their cart
 */
class TellCartContentAct extends ContentAct {
    constructor(control, items) {
        super(control);
        this.items = items;
    }

    render(input, responseBuilder) {
        log.info('TellCartContentAct: rendering...');
        if (this.items.length === 0) {
            responseBuilder.addPromptFragment(i18n.t('SHOPPING_CART_CONTROL_CART_IS_EMPTY'));
        } else {
            const itemStrs = [];
            for (const item of this.items) {
                itemStrs.push(`${renderItem(item)}`);
            }
            const content = ListFormatting.format(itemStrs, i18n.t('AND'));
            const prompt = i18n.t('SHOPPING_CART_CONTROL_TELL_CART_CONTENT', { content });
            responseBuilder.addPromptFragment(prompt);
        }
    }
}

/**
 * Show the user what is in their cart (if nothing else is using the screen)
 */
class ShowCartAct extends ContentAct {
    constructor(control, items) {
        super(control);
        this.items = items;
    }

    render(input, responseBuilder) {
        log.info('ShowCartAct: rendering...');
        if (getSupportedInterfaces(input.handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            const items = [];
            for (const item of this.items) {
                items.push({
                    primaryText: `${renderItem(item)}`
                });
            }
            const aplDataSource = {
                textListData: {
                    headerTitle: i18n.t('SHOPPING_CART_CONTROL_SHOW_CART_APL_TITLE'),
                    headerSubtitle: i18n.t('SHOPPING_CART_CONTROL_SHOW_CART_APL_SUB_TITLE'),
                    items,
                }
            };

            responseBuilder.addAPLRenderDocumentDirective('cart', generateCartListDocument(this.control.id), aplDataSource);
        }
    }
}

/**
 * Tell user an item was removed
 */
class ItemRemovedAct extends ContentAct {
    constructor(control, item) {
        super(control);
        this.item = item;
    }

    render(input, responseBuilder) {
        const itemText = renderItem(this.item);
        responseBuilder.addPromptFragment(i18n.t('SHOPPING_CART_CONTROL_ITEM_REMOVED', { itemText }));
    }
}

function renderItem(item) {
    const product = i18n.t(item.productId, { count: item.count });
    return `${item.count} ${product}`;
}

module.exports = {
    ItemAddedAct,
    AddAnotherItemAct,
    TellCartContentAct,
    ShowCartAct,
    ItemRemovedAct,
};
