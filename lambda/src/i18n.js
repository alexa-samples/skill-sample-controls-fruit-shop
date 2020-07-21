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

const i18n = require('i18next').default;
// i18n strings for all supported locales
const languageStrings = require('./languageStrings');

function updateI18n(locale) {
    i18n.init({
        lng: locale,
        fallbackLng: 'en',
        resources: languageStrings,

    });
}

module.exports = {
    i18n,
    updateI18n
};
