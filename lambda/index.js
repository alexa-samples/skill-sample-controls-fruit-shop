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

const { SkillBuilders, getLocale } = require('ask-sdk-core');
const { getSupportedInterfaces } = require('ask-sdk-core');
const { ControlManager, ControlResponseBuilder, renderActsInSequence, ControlResult, ControlInput, Control, ControlHandler } = require('ask-sdk-controls');
const { generateDefaultScreenDocument } = require('./src/defaultScreenAPL');
const { FruitShopControl } = require('./src/FruitShopControl');

const { updateI18n } = require('./src/i18n');

/**
 * ControlManager for the skill.
 *
 * This organizing component defines the Controller and View components (and also default error handling).
 */
class FruitShopControlManager extends ControlManager {

    /**
     * Create the control tree for the skill.
     *
     * Usage:
     *  * This function produces a complete tree of Controls. The `FruitShopControl` constructor creates child
     *    controls, which each create their own controls recursively.
     *  * It is not necessary to unpack state data from SessionAttributes. The framework's runtime (ControlHandler)
     *    does this automatically.
     *
     * @remarks
     * In MVC terms:
     * * The root Control of the ControlTree defines 'the Controller' for the skill.
     *   * Each child Control is a sub-Controller.
     *
     * * Each Control owns its own private sub-Model.
     *   * Taken together, the set of Control state objects define 'the Model'.
     *
     * * The framework's `ControlHandler` provides the runtime driver function.
     *
     * @returns {Control} Root control of a fully-constructed control tree.
     */
    createControlTree() {
        return new FruitShopControl({ id: 'root' });
    }

    /**
     * Render the ControlResult into a ControlResponse
     *
     * In MVC terms:
     * * The render process defines the View for the skill.
     * * Rendering transforms a ControlResult into an Alexa response by means of a ControlResponseBuilder.
     *
     * @param {ControlResult} result
     * @param {ControlInput} input
     * @param {ControlResponseBuilder} responseBuilder
     */
    render(result, input, responseBuilder) {

        /*
         * Renders each systemAct individually by calling act.control.renderAct(act, input, responseBuilder)
         *
         * This results in response that is built up by simple concatenation of fragments which is often
         * sufficient.
         */
        renderActsInSequence(result.acts, input, responseBuilder);

        /*
         * Add a default APL template if nothing is actively using the display.
         */
        if (!responseBuilder.isDisplayUsed()) {
            console.log('ShowDefaultScreenAct: rendering...');
            if (getSupportedInterfaces(input.handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                const aplDataSource = {
                    data: {
                        prompt: responseBuilder.getPrompt()
                    }
                };
                responseBuilder.addAPLRenderDocumentDirective('defaultScreen', generateDefaultScreenDocument(), aplDataSource);
            }
        }
    }
}

const controlHandler = new ControlHandler(new FruitShopControlManager());

const LocalizationRequestInterceptor = {
    process(handlerInput) {
        const locale = getLocale(handlerInput.requestEnvelope);
        updateI18n(locale);
    }
};

// Export the handler for AWS Lambda
exports.handler = SkillBuilders.custom()
    .addRequestHandlers(controlHandler)
    .withCustomUserAgent(`FruitShopDemo(JS) ${controlHandler.userAgentInfo()}`)
    .addRequestInterceptors(LocalizationRequestInterceptor)
    .lambda();

// Export the control manager for use in build_interaction_model and tests
exports.FruitShopControlManager = FruitShopControlManager;
