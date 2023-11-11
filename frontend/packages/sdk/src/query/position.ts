import {
  CoinMetadata,
  PaginatedEvents,
  SuiClient,
  SuiObjectResponse,
} from '@mysten/sui.js/dist/cjs/client';
import {
  EventWithDate,
  Position,
  PositionCreationEvent,
  PositionTypeArgs,
  RawPosition,
  RawPositionCreationEvent,
  toPosition,
  toPositionCreationEvent,
} from '../types';
import { getCoinMetadata } from './coin';
import { nonEmpty } from '../util';

export type PositionCreationEventWithDate =
  EventWithDate<PositionCreationEvent>;

type MessyPosition = {
  position: Position;
  event: PositionCreationEventWithDate;
  inputCoinType: string;
  inputCoinMetadata: CoinMetadata;
  outputCoinType: string;
  outputCoinMetadata: CoinMetadata;
};

function extractPositionEvents(
  events: PaginatedEvents
): PositionCreationEventWithDate[] {
  return events.data.map((item) => {
    return {
      createdAt: item.timestampMs
        ? new Date(Number(item.timestampMs))
        : undefined,
      event: toPositionCreationEvent(
        item.parsedJson as RawPositionCreationEvent
      ),
    };
  });
}

function extractPosition(rawObject: SuiObjectResponse): Position {
  if (rawObject.data && rawObject.data.content?.dataType === 'moveObject') {
    const raw = rawObject.data.content.fields as unknown as RawPosition;
    return toPosition(raw);
  } else {
    throw new Error('Invalid position object ' + rawObject.data?.objectId);
  }
}

function extractPositionTypeArgs(obj: SuiObjectResponse) {
  const rawType = obj.data?.type;
  if (rawType) {
    const match = /<([^,]+),\s*([^>]+)>/.exec(rawType);
    if (match && match[1] && match[2]) {
      return [match[1], match[2]] as PositionTypeArgs;
    }
  }
  throw new Error('Invalid position object ' + obj.data?.objectId);
}

export async function fetchPosition(sui: SuiClient, positionId: string) {
  const position = await sui.getObject({
    id: positionId,
    options: {
      showContent: true,
      showType: true,
    },
  });

  return {
    position: extractPosition(position),
    typeArgs: extractPositionTypeArgs(position),
  };
}

export interface GetPositionsFilter {
  owner?: string;
  coinTypes?: string[];
}

export async function getPositions(
  sui: SuiClient,
  packageId: string,
  filter?: GetPositionsFilter
): Promise<MessyPosition[]> {
  const events = await sui.queryEvents({
    query: {
      MoveEventType: `${packageId}::dca::PositionCreationEvent`,
    },
  });

  const filteredEvents = extractPositionEvents(events).filter((item) =>
    filter?.owner ? item.event.creator === filter.owner : true
  );

  const messyPositions = await Promise.all(
    filteredEvents.map(async (event) => {
      try {
        const { position, typeArgs } = await fetchPosition(
          sui,
          event.event.position_id
        );
        const inputCoinMetadata = await getCoinMetadata(sui, typeArgs[0]);
        const outputCoinMetadata = await getCoinMetadata(sui, typeArgs[1]);

        return {
          position,
          event,
          inputCoinType: typeArgs[0],
          inputCoinMetadata,
          outputCoinType: typeArgs[1],
          outputCoinMetadata,
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    })
  );

  return messyPositions.filter(nonEmpty);
}
