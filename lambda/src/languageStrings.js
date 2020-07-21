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

/*
 * Localized strings for use in prompts and APL.
 * The keys for each string will then be referenced in our code, e.g. i18n.t('WELCOME_MSG').
 * The localization interceptor in index.js initializes the i18n object with the user's locale.
 */

module.exports = {
    en: {
        translation: {
            AND: 'and',
            fruit: 'fruit',
            fruit_plural: 'fruits',
            vegetable: 'vegetable',
            vegetable_plural: 'vegetables',
            apple: 'apple',
            apple_plural: 'apples',
            banana: 'banana',
            banana_plural: 'bananas',
            orange: 'orange',
            orange_plural: 'oranges',
            mandarin: 'mandarin',
            mandarin_plural: 'mandarins',
            pineapple: 'pineapple',
            pineapple_plural: 'pineapples',
            tomato: 'tomato',
            tomato_plural: 'tomatoes',
            carrot: 'carrot',
            carrot_plural: 'carrots',
            squash: 'squash',
            squash_plural: 'squash',
            pumpkin: 'pumpkin',
            pumpkin_plural: 'pumpkins',
            lettuce: 'lettuce',
            lettuce_plural: 'lettuce',

            WELCOME_MSG: 'Welcome to the fruit shop.',

            // FruitShop Control
            FRUIT_SHOP_CONTROL_NON_UNDERSTANDING: 'I didn\'t catch that.',

            // Category Control
            CATEGORY_CONTROL_CATEGORY_IDS_VALIDATION_FAIL: 'Sorry, I don\'t know that product category.',
            CATEGORY_CONTROL_GENERAL_VALIDATION_FAIL: 'Sorry, it\'s not a valid choice.',
            CATEGORY_CONTROL_REQUEST_VALUE: 'What would you like?',

            // Product Control
            PRODUCT_CONTROL_REQUEST_VALUE_WITH_CATEGORY: 'Some of our favorite {{category}} are {{favorites}}. Which would you like?',
            PRODUCT_CONTROL_REQUEST_VALUE_WITHOUT_CATEGORY: 'Which product would you like?',

            // ItemCount control
            ITEM_COUNT_CONTROL_REQUEST_VALUE_WITH_PRODUCT: 'How many {{itemText}}?',
            ITEM_COUNT_CONTROL_REQUEST_VALUE_WITHOUT_PRODUCT: 'How many?',
            ITEM_COUNT_CONTROL_INVALID_VALUE: 'Sorry I can only accept orders of one to one hundred items.',

            // ShoppingCart control
            SHOPPING_CART_CONTROL_NON_UNDERSTANDING: 'I didn\'t get that.',
            SHOPPING_CART_CONTROL_ITEM_ADDED: 'Added {{itemText}}.',
            SHOPPING_CART_CONTROL_ADD_ANOTHER_ITEM: 'Would you like to add another item?',
            SHOPPING_CART_CONTROL_CART_IS_EMPTY: 'Your cart is empty.',
            SHOPPING_CART_CONTROL_TELL_CART_CONTENT: 'Your cart contains {{content}}.',
            SHOPPING_CART_CONTROL_SHOW_CART_APL_TITLE: 'Shopping cart',
            SHOPPING_CART_CONTROL_SHOW_CART_APL_SUB_TITLE: 'Here are the items in your cart',
            SHOPPING_CART_CONTROL_ITEM_REMOVED: 'I removed {{itemText}} from your cart.',
        }
    },
};
