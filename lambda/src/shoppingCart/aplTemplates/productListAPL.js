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

function generateProductListDocument() {
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
                'textListData'
            ],
            items: [
                {
                    type: 'Container',
                    width: '100%',
                    height: '100%',
                    items: [
                        {
                            type: 'AlexaTextList',
                            position: 'absolute',
                            theme: '${viewport.theme}',
                            headerTitle: 'Menu',
                            headerDivider: true,
                            headerBackButtonAccessibilityLabel: 'back',
                            headerBackgroundColor: 'transparent',
                            backgroundColor: 'transparent',
                            backgroundScale: 'best-fill',
                            backgroundAlign: 'center',
                            primaryAction: {
                                type: 'SendEvent',
                                arguments: [
                                    '${textListData.controlId}',
                                    '${ordinal}'
                                ]
                            },
                            listItems: '${textListData.items}',
                            headerSubtitle: 'Choose some fruits or vegetables!'
                        },
                        {
                            type: 'Container',
                            position: 'absolute',
                            right: '0',
                            top: '40dp',
                            width: '100dp',
                            height: '100dp',
                            items: [
                                {
                                    type: 'Image',
                                    width: '60',
                                    height: '60',
                                    source: 'https://ask-portiao.s3-us-west-2.amazonaws.com/list.png',
                                    align: 'top-right',
                                    scale: 'fill'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    };
}

module.exports = {
    generateProductListDocument
};
