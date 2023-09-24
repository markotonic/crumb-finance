#[test_only]
module crumb::usd {
    use std::option;
    use sui::coin;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::url;

    struct USD has drop {}

    fun init(otw: USD, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            otw,
            9,
            b"USD",
            b"Test USD",
            b"",
            option::none(),
            ctx,
        );
        // freeze_object?
        // transfer::public_freeze_object(metadata);
        // transfer::public_transfer(treasury, tx_context::sender(ctx));
        transfer::public_share_object(treasury);
        transfer::public_share_object(metadata);
    }

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(USD {}, ctx)
    }
}