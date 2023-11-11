module crumb::usdc {
    use std::option;
    use sui::coin;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::url;

    struct USDC has drop {}

    fun init(otw: USDC, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            otw,
            6,
            b"USDC",
            b"Crumb Test USD",
            b"",
            option::none(),
            ctx,
        );
        transfer::public_share_object(treasury);
        transfer::public_share_object(metadata);
    }

    #[test_only]
    public fun init_test_usdc(ctx: &mut TxContext) {
        init(USDC {}, ctx)
    }
}