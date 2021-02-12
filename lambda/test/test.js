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

const { ControlHandler, GeneralControlIntent, ValueControlIntent, Strings, AmazonIntent,
    waitForDebugger, TestInput, SkillTester, IntentBuilder, AmazonBuiltInSlotType } = require('ask-sdk-controls');
const { before, after, describe, test } = require('mocha');
const sinon = require('sinon');
const { FruitShopControlManager } = require('../index');
const { updateI18n } = require('../src/i18n');

waitForDebugger();
// use locale to 'newLocale' is to test the fallback mechanism of 18n
updateI18n('newLocale');

/**
 * @param {SkillTester} tester
 */
async function chooseApples(tester) {
    await tester.testTurn(
        'U: __', TestInput.launchRequest(),
        'A: Welcome to the fruit shop. What would you like?'
    );

    await tester.testTurn(
        'U: fruit', TestInput.intent(ValueControlIntent.of('Category', { Category: 'fruit' })),
        'A: Some of our favorite fruits are apples, bananas and oranges. Which would you like?'
    );

    await tester.testTurn(
        'U: apples', TestInput.intent(ValueControlIntent.of('Product', { Product: 'apple' })),
        'A: How many apples?'
    );
}

/**
 * @param {SkillTester} tester
 */
async function addOneApple(tester) {
    await chooseApples(tester);

    await tester.testTurn(
        'U: one', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '1' })),
        'A: OK. Added 1 apple. Would you like to add another item?'
    );
}

/**
 * @param {SkillTester} tester
 */
async function addOneAppleAndProceedToDeliveryStep(tester) {
    await addOneApple(tester);

    await tester.testTurn(
        'U: no', TestInput.intent(GeneralControlIntent.of({ feedback: Strings.Feedback.Disaffirm })),
        'A: OK. When would you like these items delivered?'
    );
}

describe('all', () => {
    before(() => {
        // set now to 2019-01-03
        sinon.useFakeTimers(new Date('2019-01-03T21:55:38.151Z'));
    });
    after(() => {
        // set now to 2019-01-03
        sinon.restore();
    });

    describe('Simple dialogs - user follows the system initiative', () => {
        test('welcome', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await tester.testTurn(
                'U: __', TestInput.launchRequest(),
                'A: Welcome to the fruit shop. What would you like?'
            );
        });

        test('choose to add apples', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);
        });

        test('choose invalid category', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await tester.testTurn(
                'U: __', TestInput.launchRequest(),
                'A: Welcome to the fruit shop. What would you like?'
            );

            await tester.testTurn(
                'U: meat', TestInput.intent(ValueControlIntent.of('Category', { Category: 'meat' })),
                'A: Sorry, I don\'t know that product category. What would you like?'
            );
        });

        test('add one apple and move to delivery step', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await addOneApple(tester);
        });

        test('Complete selection of delivery date', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await addOneAppleAndProceedToDeliveryStep(tester);

            await tester.testTurn(
                'U: tuesday', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.DATE, { 'AMAZON.DATE': '2019-01-08' })),
                'A: Delivery will be on 2019-01-08.'
            );
        });

        test('Direct add of complete line item via AddItemIntent.', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await tester.testTurn(
                'U: __', TestInput.launchRequest(),
                'A: Welcome to the fruit shop. What would you like?'
            );

            await tester.testTurn(
                'U: Add two carrots to cart', TestInput.intent('AddItemIntent', { product: 'carrot', count: 2 }),
                'A: Added 2 carrots. Would you like to add another item?'
            );
        });

        test('choose to add apples. choose zero apples', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);
            await tester.testTurn(
                'U: zero', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '0' })),
                'A: Sorry I can only accept orders of one to one hundred items. How many apples?'
            );
        });
    });

    describe('User initiative', () => {
        test('User jumps past category. System should not subsequently ask for category', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await tester.testTurn(
                'U: __', TestInput.launchRequest(),
                'A: Welcome to the fruit shop. What would you like?'
            );

            await tester.testTurn(
                'U: apples', TestInput.intent(ValueControlIntent.of('Product', { Product: 'apple' })),
                'A: How many apples?'
            );

            await tester.testTurn(
                'U: one', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '1' })),
                'A: OK. Added 1 apple. Would you like to add another item?'
            );

            await tester.testTurn(
                'U: no', TestInput.intent(GeneralControlIntent.of({ feedback: Strings.Feedback.Disaffirm })),
                'A: OK. When would you like these items delivered?'
            );

            await tester.testTurn(
                'U: tuesday', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.DATE, { 'AMAZON.DATE': '2019-01-08' })),
                'A: Delivery will be on 2019-01-08.'
            );
        });

        test('User adds a new item after starting checkout.', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));

            await addOneAppleAndProceedToDeliveryStep(tester);

            await tester.testTurn(
                'U: add pumpkins', TestInput.intent(ValueControlIntent.of('Product', { action: Strings.Action.Set, Product: 'pumpkin' })),
                'A: How many pumpkins?'
            );

            // await tester.testTurn(
            //     'U: one', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '1' })),
            //     'A: OK. Added 1 pumpkin. Would you like to add another item?'
            // );

            // await tester.testTurn(
            //     'U: no', TestInput.intent(GeneralControlIntent.of({ feedback: Strings.Feedback.Disaffirm })),
            //     'A: OK. OK. When would you like these items delivered?'
            // );

            // await tester.testTurn(
            //     'U: tuesday', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.DATE, { 'AMAZON.DATE': '2019-01-08' })),
            //     'A: OK delivery will be on 2019-01-08.'
            // );
        });
    });

    describe('Reviewing the cart contents', () => {
        test('Check cart when empty', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await tester.testTurn(
                'U: __', TestInput.launchRequest(),
                'A: Welcome to the fruit shop. What would you like?'
            );

            await tester.testTurn(
                'U: whats in my cart', TestInput.intent('CheckCartIntent'),
                'A: Your cart is empty. Would you like to add another item?'
            );
        });

        test('Check cart when has item', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await addOneApple(tester);

            await tester.testTurn(
                'U: whats in my cart', TestInput.intent('CheckCartIntent'),
                'A: Your cart contains 1 apple. Would you like to add another item?'
            );
        });

        test('Check cart after moving to checkout. yes to added another', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await addOneAppleAndProceedToDeliveryStep(tester);

            await tester.testTurn(
                'U: whats in my cart', TestInput.intent('CheckCartIntent'),
                'A: Your cart contains 1 apple. Would you like to add another item?'
            );

            await tester.testTurn(
                'U: yes', TestInput.intent(GeneralControlIntent.of({ feedback: Strings.Feedback.Affirm })),
                'A: OK. What would you like?'
            );
        });

        test('Check cart after moving to checkout. no to added another', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await addOneAppleAndProceedToDeliveryStep(tester);

            await tester.testTurn(
                'U: whats in my cart', TestInput.intent('CheckCartIntent'),
                'A: Your cart contains 1 apple. Would you like to add another item?'
            );

            await tester.testTurn(
                'U: no', TestInput.intent(GeneralControlIntent.of({ feedback: Strings.Feedback.Disaffirm })),
                'A: OK. When would you like these items delivered?'
            );
        });
    });

    describe('Dealing with item-count issues -- user follows system initiative', () => {
        // Note: testing valid/expected and running the 'recovery dialogs' is handled by the built-in NumberControl.
        //       but notice that some prompts include fragments from NumberControl and some from the domain-specific controls.

        test('User selects an invalid number of items', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);

            await tester.testTurn(
                'U: two hundred', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '200' })),
                'A: Sorry I can only accept orders of one to one hundred items. How many apples?'
            );

            await tester.testTurn(
                'U: two', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '2' })),
                'A: OK. Added 2 apples. Would you like to add another item?'
            );
        });

        test('User selects an unexpected number of items (10) then affirms the selection ', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);

            await tester.testTurn(
                'U: ten', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '10' })),
                'A: Was that 10?'
            );

            await tester.testTurn(
                'U: yes', TestInput.intent(IntentBuilder.of(AmazonIntent.YesIntent)),
                'A: Great. Added 10 apples. Would you like to add another item?'
            );
        });

        test('User selects an unexpected number of items (10) then disaffirms the selection', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);

            await tester.testTurn(
                'U: ten', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '10' })),
                'A: Was that 10?'
            );

            await tester.testTurn(
                'U: no', TestInput.intent(IntentBuilder.of(AmazonIntent.NoIntent)),
                'A: My mistake. How many apples?'
            );

            await tester.testTurn(
                'U: two', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '2' })),
                'A: OK. Added 2 apples. Would you like to add another item?'
            );
        });

        test('User selects an unexpected number of items (10) then disaffirms with new value', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);

            await tester.testTurn(
                'U: ten', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '10' })),
                'A: Was that 10?'
            );

            await tester.testTurn(
                'U: no, two', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { feedback: Strings.Feedback.Disaffirm, 'AMAZON.NUMBER': '2' })),
                'A: OK. Added 2 apples. Would you like to add another item?'
            );
        });

        test('User selects an unexpected number of items (10) then says new value', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);

            await tester.testTurn(
                'U: ten', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '10' })),
                'A: Was that 10?'
            );

            await tester.testTurn(
                'U: two', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '2' })),
                'A: OK. Added 2 apples. Would you like to add another item?'
            );
        });

        test('User selects an unexpected number of items (10) then says new unexpected value (20)', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);

            await tester.testTurn(
                'U: ten', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '10' })),
                'A: Was that 10?'
            );

            await tester.testTurn(
                'U: twenty', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '20' })),
                'A: Was that 20?'
            );
        });

        /*
         * ! Blocker! NumberControl needs to be refactored to include testing of invalid/unexpected in canTakeInitiative.
         * until that is fixed, A direct AddItemIntent will bypass the checks.
         */
        // test('Direct add of line item that has validation issues.', async () => {
        //     const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
        //     await launchTurn(tester);

        //     await tester.testTurn(
        //         'U: tuesday', TestInput.intent('AddItemIntent', { product: 'carrots', count: 200 }),
        //         'A: Sorry that is invalid...');
        // });
    });

    describe('Dealing with item-count issues -- user takes initiative', () => {
        // Note: testing valid/expected and running the 'recovery dialogs' is handled by the built-in NumberControl.
        //       but notice that some prompts include fragments from NumberControl and some from the domain-specific controls.

        test('User changes mind about item to add', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);

            await tester.testTurn(
                'U: two hundred', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '200' })),
                'A: Sorry I can only accept orders of one to one hundred items. How many apples?'
            );

            await tester.testTurn(
                'U: add bananas', TestInput.intent(ValueControlIntent.of('Product', { action: Strings.Action.Set, Product: 'banana' })),
                'A: How many bananas?'
            );

            await tester.testTurn(
                'U: two', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '2' })),
                'A: OK. Added 2 bananas. Would you like to add another item?'
            );
        });
    });

    describe('User initiative and category helper', () => {
        test('User asks for fruit but then adds a vegetable', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await tester.testTurn(
                'U: __', TestInput.launchRequest(),
                'A: Welcome to the fruit shop. What would you like?'
            );
            await tester.testTurn(
                'U: fruit', TestInput.intent(ValueControlIntent.of('Category', { Category: 'fruit' })),
                'A: Some of our favorite fruits are apples, bananas and oranges. Which would you like?'
            );
            await tester.testTurn(
                'U: carrots', TestInput.intent(ValueControlIntent.of('Product', { Product: 'carrot' })),
                'A: How many carrots?'
            );
        });
    });

    /*
     * FallbackIntent handling is interesting as it should not be treated like regular user-initiative
     * as we have no idea what the user said.  It is OK for controls involved in generating the last
     * question to do something special, but we should not consult arbitrary controls.  The built-in
     * decision logic for ContainerControl takes care of this.
     */
    describe('FallbackIntent', () => {
        test('Fallback while cartControl active. Cart control special handling kicks in.', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await chooseApples(tester);

            await tester.testTurn(
                'U: <gibberish>', TestInput.intent(IntentBuilder.of('AMAZON.FallbackIntent')),
                "A: I didn't get that. How many apples?"
            );
        });
        test('Fallback while delivery active. The rootControl handling wins. CartControl is not consulted.', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await addOneAppleAndProceedToDeliveryStep(tester);

            await tester.testTurn(
                'U: <gibberish>', TestInput.intent(IntentBuilder.of('AMAZON.FallbackIntent')),
                "A: I didn't catch that. When would you like these items delivered?"
            );
        });
    });

    describe('Multi-value slots', () => {

        /*
         * Adds "apples and bananas" to the stack of things to add to cart by means of a Multi-valued-slot on AddProductIntent.
         * The shopping-cart control manages a lightweight agenda-tracker.. once the first topic is completed, the next is activated.
         */
        test('<desc>', async () => {
            const tester = new SkillTester(new ControlHandler(new FruitShopControlManager()));
            await tester.testTurn(
                'U: __', TestInput.launchRequest(),
                'A: Welcome to the fruit shop. What would you like?'
            );

            await tester.testTurn(
                'U: Add apples and bananas',
                TestInput.intent('AddProductIntent', { product: ['apple', 'banana'] }),
                'A: How many apples?'
            );
            await tester.testTurn(
                'U: zero', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '0' })),
                'A: Sorry I can only accept orders of one to one hundred items. How many apples?'
            );
            await tester.testTurn(
                'U: one', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '1' })),
                'A: OK. Added 1 apple. How many bananas?'
            );
            await tester.testTurn(
                'U: two', TestInput.intent(ValueControlIntent.of(AmazonBuiltInSlotType.NUMBER, { 'AMAZON.NUMBER': '2' })),
                'A: OK. Added 2 bananas. Would you like to add another item?'
            );
        });
    });

});

/*
 * Tests yet to be written (but functionality implemented)
 *  * Touch interaction with shopping cart
 *  * Touch interaction with ListControls (category, product)
 */
