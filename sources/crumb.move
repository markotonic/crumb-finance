module crumb::dca {
    use sui::balance::{Self, Balance};
    use std::type_name::{Self, TypeName};
    use sui::coin::{Self, Coin, CoinMetadata};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};
    use std::string::{Self, String};
    use sui::table::{Self, Table};

    use crumb::math::muldiv_u128;

    // This dependency allows us to check whether type
    // is a one-time witness (OTW)
    use sui::types;

    const EInsufficientFunds: u64 = 100;
    const EBadTrade: u64 = 101;
    const EDuplicateAsset: u64 = 102;
    const EInvalidAssets: u64 = 106;
    const EInvalidPrice: u64 = 107;
    const EStalePrice: u64 = 108;


    // Define the Position resource
    struct Position<phantom InputToken, phantom OutputToken> has store, key {
        id: UID,
        owner: address, 
        // TODO: should this be a Balance? 
        amount_per_trade: u64,
        frequency: u64,
        last_trade_time: u64,
        deposit: Balance<InputToken>,
        received: Balance<OutputToken>,
    }

    struct Asset<phantom Token> has key {
        id: UID,
        name: String,
        // Assume USD has 6 decimals
        price_usd: u64,
        decimals: u8,
    }

    struct Global has key {
        id: UID,
        admin: address,
        available_assets: Table<TypeName, bool>,
    }

    struct Admin has key {
        id: UID,
    }

    struct Oracle has key {
        id: UID,
    }

    fun init(ctx: &mut TxContext) {
        let global = Global {
            id: object::new(ctx),
            // TODO: config in move.toml, use &signer param
            admin: sender(ctx),
            available_assets: table::new(ctx),
        };
        transfer::share_object(global);
        transfer::transfer(
            Admin{ id: object::new(ctx) },
            sender(ctx)
        );
        transfer::transfer(
            Oracle { id: object::new(ctx) },
            sender(ctx)
        )
    }

    // There's only 1 CoinMeta per coin, which will be the source of truth
    public fun add_asset<Token>(_: &Admin, coin_meta: &CoinMetadata<Token>, global: &mut Global, ctx: &mut TxContext) {
        // TODO: Is this the idiomatic way to do this? no global storage in sui
        let asset_type = type_name::get<Token>();
        assert!(table::contains(&global.available_assets, asset_type) == false, EDuplicateAsset);
        table::add(&mut global.available_assets, asset_type, true);
        let asset = Asset<Token> {
            id: object::new(ctx),
            name: coin::get_name(coin_meta),
            decimals: coin::get_decimals(coin_meta),
            price_usd: 0
        };

        transfer::share_object(asset);
    }

    public fun update_price<T>(_: &Oracle, asset: &mut Asset<T>, price_usd: u64) {
        asset.price_usd = price_usd
    }


    public fun create_position<InputToken, OutputToken>(
        deposit: Coin<InputToken>,
        amount_per_trade: u64,
        frequency: u64,
        ctx: &mut TxContext,
    ): ID {
        // Verify that input/output are valid assets
        // Verify that amount per trade >= the deposit amount
        let deposit_balance = coin::into_balance(deposit);
        let position = Position<InputToken, OutputToken> {
            id: object::new(ctx),
            owner: sender(ctx),
            amount_per_trade: amount_per_trade, 
            frequency: frequency,
            last_trade_time: 0,
            deposit: deposit_balance, 
            received: balance::zero<OutputToken>(),
        };

        let position_id = object::id(&position);
        transfer::share_object(position);
        position_id
    }

    public fun execute_trade<InputToken, OutputToken>(
        position: &mut Position<InputToken, OutputToken>,
        trade_out: Coin<OutputToken>,
        input_asset: &Asset<InputToken>,
        output_asset: &Asset<OutputToken>
    ): Balance<InputToken> {
        // Get the price of the input asset and output asset
        // Calculate if the amount of the output asset provided is sufficient to execute the trade
        let input_asset_price = input_asset.price_usd;
        let output_asset_price = output_asset.price_usd;
        let output_asset_balance = coin::into_balance(trade_out);
        let trade_in_amount = position.amount_per_trade;
        let trade_out_amount: u64 = balance::value<OutputToken>(&output_asset_balance);

        let base: u128 = 10;
        let trade_in_usd = muldiv_u128((trade_in_amount as u128), (input_asset_price as u128), 10);
        let trade_out_usd = muldiv_u128((trade_out_amount as u128), (output_asset_price as u128), 10);
        // TODO: account for fee
        assert!(trade_in_usd <= trade_out_usd, EBadTrade);
        
        let spent = balance::split(&mut position.deposit, position.amount_per_trade);
        balance::join(&mut position.received, output_asset_balance);
        spent
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }
} 