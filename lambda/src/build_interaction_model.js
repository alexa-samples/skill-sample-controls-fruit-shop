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

const { ControlInteractionModelGenerator, Logger } = require('ask-sdk-controls');
const { FruitShopControlManager } = require('../index');

const log = new Logger('FruitShopJS:InteractionModel');

// the built-ins could either be loaded from a starting IM file, eg .loadFromFile('starter-en-US')
// or perhaps we could offer things like .ensureRequiredIntentsForAPL()

new ControlInteractionModelGenerator()
    .withInvocationName('fruit shop')

    // Mandatory intents
    .addIntent({ name: 'AMAZON.StopIntent' })
    .addIntent({ name: 'AMAZON.NavigateHomeIntent' })
    .addIntent({ name: 'AMAZON.HelpIntent' })
    .addIntent({ name: 'AMAZON.CancelIntent' })
    .addIntent({ name: 'AMAZON.MoreIntent' })
    .addIntent({ name: 'AMAZON.NavigateSettingsIntent' })
    .addIntent({ name: 'AMAZON.PageUpIntent' })
    .addIntent({ name: 'AMAZON.PageDownIntent' })
    .addIntent({ name: 'AMAZON.PreviousIntent' })
    .addIntent({ name: 'AMAZON.ScrollRightIntent' })
    .addIntent({ name: 'AMAZON.ScrollDownIntent' })
    .addIntent({ name: 'AMAZON.ScrollLeftIntent' })
    .addIntent({ name: 'AMAZON.ScrollUpIntent' })
    .addIntent({ name: 'AMAZON.FallbackIntent' })
    .addIntent({ name: 'AMAZON.YesIntent' })
    .addIntent({ name: 'AMAZON.NoIntent' })

    // Domain-specific intents
    .addIntent({
        name: 'CheckCartIntent',
        slots: [
            {
                name: 'cart',
                type: 'cart'
            }
        ],
        samples: [
            'what items do I have',
            'what is in {cart}',
            'what\'s in {cart}',
            'review',
            'check {cart}',
            'check {cart} items',
            'review {cart}',
        ]
    })

    .addIntent({
        name: 'AddItemIntent',
        slots: [
            {
                name: 'action',
                type: 'action',
            },
            {
                name: 'product',
                type: 'Product',
            },
            {
                name: 'count',
                type: 'AMAZON.NUMBER',
            },
            {
                name: 'cart',
                type: 'cart'
            }
        ],
        samples: [
            // '{count} {product}',  // The verb is unclear: could be add or remove. Add this when disambiguation logic is implemented.
            '{action} {count} {product}',
            '{action} {count} {product} to {cart}',
            '{action} {count} {product} in {cart}',
            '{count} {product}'
        ]
    })

    .addIntent({
        name: 'AddProductIntent',
        slots: [
            {
                name: 'action',
                type: 'action'
            },
            {
                name: 'product',
                type: 'Product',
                // @ts-ignore
                multipleValues: {
                    enabled: true // Multi-value-slots (beta)
                }
            },
            {
                name: 'preposition',
                type: 'preposition'
            },
            {
                name: 'target',
                type: 'target'
            },
            {
                name: 'head',
                type: 'head'
            },
            {
                name: 'tail',
                type: 'tail'
            }
        ],
        samples: [
            '{action} {product} {preposition} {target}',
            '{action} {product}',
            '{head} {action} {product}',
            '{action} {product} {tail}',
            '{head} {action} {product} {tail}'
        ]
    })

    // Domain-specific slot types
    .addOrMergeSlotTypes({
        name: 'Category',
        values:
            [
                { id: 'fruit', name: { value: 'fruit', synonyms: ['fruits'] } },
                { id: 'vegetable', name: { value: 'vegetable', synonyms: ['vegetables', 'veges', 'veggies', 'veg'] } }
            ]
    })
    .addOrMergeSlotTypes({
        name: 'Product',
        values:
            [
                { id: 'apple', name: { value: 'apple', synonyms: ['apples'] } },
                { id: 'banana', name: { value: 'banana', synonyms: ['bananas'] } },
                { id: 'orange', name: { value: 'orange', synonyms: ['oranges'] } },
                { id: 'mandarin', name: { value: 'mandarin', synonyms: ['oranges'] } },
                { id: 'pineapple', name: { value: 'pineapple', synonyms: ['pineapples'] } },

                { id: 'tomato', name: { value: 'tomato', synonyms: ['tomatoes'] } },
                { id: 'carrot', name: { value: 'carrot', synonyms: ['carrots'] } },
                { id: 'squash', name: { value: 'squash', synonyms: ['squashes'] } },
                { id: 'pumpkin', name: { value: 'pumpkin', synonyms: ['pumpkins'] } },
                { id: 'lettuce', name: { value: 'lettuce', synonyms: ['lettuces'] } },
            ]
    })
    .addOrMergeSlotTypes({
        name: 'cart',
        values: [
            {
                id: 'cart',
                name: {
                    value: 'cart',
                    synonyms: [
                        'the cart',
                        'my cart',
                        'shopping cart',
                        'the shopping cart',
                        'my shopping cart',
                        'bag',
                        'the bag',
                        'my bag',
                        'shopping bag',
                        'the shopping bag',
                        'my shopping bag',
                        'list',
                        'the list',
                        'my list',
                        'shopping list',
                        'the shopping list',
                        'my shopping list',
                    ]
                }
            }
        ]
    })

    // Additional targets
    .addOrMergeSlotTypes({ name: 'target', values: [] }) // ensure target slot exists.
    .addValuesToSlotType('target', {
        id: 'category',
        name: {
            value: 'category',
            synonyms: [
            ]
        }
    })
    .addValuesToSlotType('target', {
        id: 'product',
        name: {
            value: 'product',
            synonyms: [
            ]
        }
    })
    .addValuesToSlotType('target', {
        id: 'count',
        name: {
            value: 'count',
            synonyms: [
                'item count',
                'number of items',
            ]
        }
    })
    .addValuesToSlotType('target', {
        id: 'deliveryDate',
        name: {
            value: 'deliveryDate',
            synonyms: [
                'delivery date',
                'date to deliver',
            ]
        }
    })
    .buildCoreModelForControls(new FruitShopControlManager())
    .buildAndWrite('en-US-generated.json');

log.info('done');
