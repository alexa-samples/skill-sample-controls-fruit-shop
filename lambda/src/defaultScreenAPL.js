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

/**
 * An APL template for when nothing is actively using the screen
 * The is useful to avoid stale UI being left dangling.
 *
 * Because it displays the prompt, it should be added to the response at the last moment.
 */
function generateDefaultScreenDocument() {
    return {
        type: 'APL',
        version: '1.3',
        import: [
            {
                name: 'alexa-layouts',
                version: '1.1.0'
            }
        ],
        mainTemplate: {
            parameters: [
                'data'
            ],
            items: [
                {
                    type: 'Container',
                    width: '100%',
                    height: '100%',
                    items: [
                        {
                            type: 'AlexaHeadline',
                            // "headerAttributionImage": "https://ask-portiao.s3-us-west-2.amazonaws.com/list.png",
                            headerBackButton: false,
                            headerTitle: 'Fruit Shop',
                            // "headerSubtitle": "Fruit Shop",
                            headerDivider: true,
                            headerBackButtonAccessibilityLabel: 'back',
                            headerBackgroundColor: 'transparent',
                            primaryText: '',
                            secondaryText: '${data.prompt}',
                            // "footerHintText": "footerHintText",
                            backgroundColor: 'transparent',
                            backgroundScale: 'best-fill',
                            backgroundAlign: 'center',
                        }
                    ]
                }
            ]
        }
    };
}

module.exports = {
    generateDefaultScreenDocument
};
