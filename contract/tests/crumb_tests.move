#[test_only]
module crumb::tests {
    use std::option;
    use sui::test_scenario::{Self, Scenario};
    use sui::tx_context::{Self};
    use sui::balance::{Self, Balance};
    use sui::transfer;
    use sui::coin::{Self, Coin, CoinMetadata};
    use sui::sui::SUI;
    use crumb::dca::{
        Self, Admin, Asset, Oracle, 
        add_asset, Global, Position, 
        init_for_testing, update_price, 
        create_position, execute_trade
    };
    use crumb::usd::{USD, init_test_usd};
    use crumb::test_sui::{TEST_SUI, init_test_sui};

    const ADMIN: address = @0xABBA;
    const USER: address = @0xB0B;
    const KEEPER: address = @0xC0C;

    // OTWs for currencies used in tests
    // struct USD has drop {}
    
    const USD_DECIMALS: u64 = 6;
    const ONE_USD: u64 = 1_000_000;
    const ONE_SUI: u64 = 1_000_000_000;

    public fun dollars(n: u64): u64 {
        ONE_USD * n 
    }

    public fun sui(n: u64): u64 {
        ONE_SUI * n
    }

    fun scenario_init(sender: address): Scenario {
        let scenario = test_scenario::begin(ADMIN);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            init_for_testing(ctx);
        };
        test_scenario::next_tx(&mut scenario, sender);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            init_test_usd(ctx);
        };
        test_scenario::next_tx(&mut scenario, sender);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            init_test_sui(ctx);
        };
        test_scenario::next_tx(&mut scenario, sender);
        scenario
    }


    fun setup_assets_test(scenario: &mut test_scenario::Scenario) {
        let global = test_scenario::take_shared<Global>(scenario);
        let admin = test_scenario::take_from_address<Admin>(scenario, ADMIN);
        let usd_meta = test_scenario::take_shared<CoinMetadata<USD>>(scenario);
        let sui_meta = test_scenario::take_shared<CoinMetadata<TEST_SUI>>(scenario);
        let ctx = test_scenario::ctx(scenario);

        add_asset<TEST_SUI>(&admin, &sui_meta, &mut global, ctx);
        add_asset<USD>(&admin, &usd_meta, &mut global, ctx);

        test_scenario::return_shared(global);
        test_scenario::return_shared(sui_meta);
        test_scenario::return_shared(usd_meta);
        test_scenario::return_to_address(ADMIN, admin);
    }


    fun update_prices_test(scenario: &mut test_scenario::Scenario, sui_price: u64) {
        let admin = test_scenario::take_from_address<Admin>(scenario, ADMIN);
        let oracle = test_scenario::take_from_address<Oracle>(scenario, ADMIN);
        let ctx = test_scenario::ctx(scenario);

        let sui_asset = test_scenario::take_shared<Asset<TEST_SUI>>(scenario);
        let usd_asset = test_scenario::take_shared<Asset<USD>>(scenario);
        update_price<TEST_SUI>(&oracle, &mut sui_asset, sui_price); // $0.50
        update_price<USD>(&oracle, &mut usd_asset, 1000000); // $1.00

        test_scenario::return_shared(sui_asset);
        test_scenario::return_shared(usd_asset);
        test_scenario::return_to_address(ADMIN, admin);
        test_scenario::return_to_address(ADMIN, oracle);
    }

    #[test]
    fun test_create_asset() {
        let scenario_val = scenario_init(ADMIN);
        let scenario = &mut scenario_val;
        test_scenario::next_tx(scenario, ADMIN);
        {
            let global = test_scenario::take_shared<Global>(scenario);
            let admin = test_scenario::take_from_address<Admin>(scenario, ADMIN);
            let sui_meta = test_scenario::take_shared<CoinMetadata<TEST_SUI>>(scenario);
            let ctx = test_scenario::ctx(scenario);

            add_asset<TEST_SUI>(&admin, &sui_meta, &mut global, ctx);

            test_scenario::return_shared(global);
            test_scenario::return_shared(sui_meta);
            test_scenario::return_to_address(ADMIN, admin);
        };
        
        test_scenario::end(scenario_val);
    }

    

    #[test]
    #[expected_failure(abort_code = dca::EDuplicateAsset)]
    fun test_duplicate_asset() {
        let scenario_val = scenario_init(ADMIN);
        let scenario = &mut scenario_val;
        {
            let global = test_scenario::take_shared<Global>(scenario);
            let admin = test_scenario::take_from_address<Admin>(scenario, ADMIN);
            let sui_meta = test_scenario::take_shared<CoinMetadata<TEST_SUI>>(scenario);
            let ctx = test_scenario::ctx(scenario);

            add_asset<TEST_SUI>(&admin, &sui_meta, &mut global, ctx);
            add_asset<TEST_SUI>(&admin, &sui_meta, &mut global, ctx);

            test_scenario::return_shared(global);
            test_scenario::return_shared(sui_meta);
            test_scenario::return_to_address(ADMIN, admin);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_update_oracle() {
        let scenario_val = scenario_init(ADMIN);
        let scenario = &mut scenario_val;
        {
            let global = test_scenario::take_shared<Global>(scenario);
            let admin = test_scenario::take_from_address<Admin>(scenario, ADMIN);
            let sui_meta = test_scenario::take_shared<CoinMetadata<TEST_SUI>>(scenario);
            let ctx = test_scenario::ctx(scenario);

            add_asset<TEST_SUI>(&admin, &sui_meta, &mut global, ctx);

            test_scenario::return_shared(global);
            test_scenario::return_shared(sui_meta);
            test_scenario::return_to_address(ADMIN, admin);
        };
        
        test_scenario::next_tx(scenario, ADMIN);
        {
            let admin = test_scenario::take_from_address<Admin>(scenario, ADMIN);
            let oracle = test_scenario::take_from_address<Oracle>(scenario, ADMIN);
            let ctx = test_scenario::ctx(scenario);

            let sui_asset = test_scenario::take_shared<Asset<TEST_SUI>>(scenario);
            update_price<TEST_SUI>(&oracle, &mut sui_asset, 1000000);

            test_scenario::return_shared(sui_asset);
            test_scenario::return_to_address(ADMIN, admin);
            test_scenario::return_to_address(ADMIN, oracle);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_create_position() {
        // Initial setup
        let scenario_val = scenario_init(ADMIN);
        let scenario = &mut scenario_val;
        setup_assets_test(scenario);

        // Set price for SUI and USD
        test_scenario::next_tx(scenario, ADMIN);
        update_prices_test(scenario, 5000000);

        // Long SUI position 
        test_scenario::next_tx(scenario, ADMIN);
        {
            let ctx = test_scenario::ctx(scenario);
            let usd_balance = balance::create_for_testing<USD>(dollars(100)); 
            let deposit = coin::from_balance(usd_balance, ctx);
            let amount: u64 = 10000000;
            create_position<USD, TEST_SUI>(deposit, amount, 1, ctx);
        };

        test_scenario::next_tx(scenario, ADMIN);
        {
            let long_position = test_scenario::take_shared<Position<USD,TEST_SUI>>(scenario);
            test_scenario::return_shared(long_position);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_execute_trade() {
        // Initial setup
        let scenario_val = scenario_init(ADMIN);
        let scenario = &mut scenario_val;
        setup_assets_test(scenario);

        // Set price for SUI and USD
        test_scenario::next_tx(scenario, ADMIN);
        update_prices_test(scenario, dollars(1) / 2); // $0.50

        // Long SUI position 
        test_scenario::next_tx(scenario, ADMIN);
        {
            let ctx = test_scenario::ctx(scenario);
            let usd_balance = balance::create_for_testing<USD>(dollars(5)); 
            let deposit = coin::from_balance(usd_balance, ctx);
            let amount: u64 = dollars(1);
            // 5 trades of $1 each
            create_position<USD, TEST_SUI>(deposit, amount, 1, ctx);
        };

        test_scenario::next_tx(scenario, KEEPER);
        {
            let ctx = test_scenario::ctx(scenario);
            // With Sui at $0.50 should receive 2 SUI
            let sui_balance = balance::create_for_testing<TEST_SUI>(sui(2)); 
            let sui_coin = coin::from_balance(sui_balance, ctx);

            let long_position = test_scenario::take_shared<Position<USD,TEST_SUI>>(scenario);
            let sui_asset = test_scenario::take_shared<Asset<TEST_SUI>>(scenario);
            let usd_asset = test_scenario::take_shared<Asset<USD>>(scenario);

            execute_trade<USD, TEST_SUI>(&mut long_position, sui_coin, &usd_asset, &sui_asset, test_scenario::ctx(scenario));
            // assert!(balance::value<USD>(&usd_balance) == dollars(1), 0);
            // balance::destroy_for_testing(usd_balance);

            test_scenario::return_shared(long_position);
            test_scenario::return_shared(sui_asset);
            test_scenario::return_shared(usd_asset);
        };
        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = dca::EBadTrade)]
    fun test_execute_bad_trade() {
        // Initial setup
        let scenario_val = scenario_init(ADMIN);
        let scenario = &mut scenario_val;
        setup_assets_test(scenario);

        // Set price for SUI and USD
        test_scenario::next_tx(scenario, ADMIN);
        update_prices_test(scenario, dollars(1) / 2); // $0.50

        // Long SUI position 
        test_scenario::next_tx(scenario, ADMIN);
        {
            let ctx = test_scenario::ctx(scenario);
            let usd_balance = balance::create_for_testing<USD>(dollars(5)); 
            let deposit = coin::from_balance(usd_balance, ctx);
            let amount: u64 = dollars(1);
            // 5 trades of $1 each
            create_position<USD, TEST_SUI>(deposit, amount, 1, ctx);
        };

        test_scenario::next_tx(scenario, KEEPER);
        {
            let ctx = test_scenario::ctx(scenario);
            // With Sui at $0.50 should receive 2 SUI, try sending less
            let sui_balance = balance::create_for_testing<TEST_SUI>(sui(1)); 
            let sui_coin = coin::from_balance(sui_balance, ctx);

            let long_position = test_scenario::take_shared<Position<USD,TEST_SUI>>(scenario);
            let sui_asset = test_scenario::take_shared<Asset<TEST_SUI>>(scenario);
            let usd_asset = test_scenario::take_shared<Asset<USD>>(scenario);

            execute_trade<USD, TEST_SUI>(&mut long_position, sui_coin, &usd_asset, &sui_asset, test_scenario::ctx(scenario));
            // balance::destroy_for_testing(usd_balance);

            test_scenario::return_shared(long_position);
            test_scenario::return_shared(sui_asset);
            test_scenario::return_shared(usd_asset);
        };
        test_scenario::end(scenario_val);
    }
}