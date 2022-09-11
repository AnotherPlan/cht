import {
    makeApiRequest,
    generateSymbol,
    parseFullSymbol,
} from './helpers.js';
import {
    subscribeOnStream,
    unsubscribeFromStream,
} from './streaming.js';

const lastBarsCache = new Map();
const configurationData = {
    supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
    exchanges: [{
        value: 'LaBit',
        name: 'LaBit',
        desc: 'LaBit',
    },
    ],
    symbols_types: [{
        name: 'crypto',
        value: 'crypto',
    },
        // ...
    ],
};

async function getAllSymbols() {
    const data = { "Response": "Success", "Message": "", "HasWarning": false, "Type": 100, "RateLimit": {}, "Data": { "LaBit": { "pairs": { "BTC": ["USDT"], "ETH": ["USDT"], "XRP": ["USDT"], "TRX": ["USDT"] }, "isActive": false, "isTopTier": false } } }

    let allSymbols = [];
    for (const exchange of configurationData.exchanges) {
        const pairs = data.Data[exchange.value].pairs;
        for (const leftPairPart of Object.keys(pairs)) {
            const symbols = pairs[leftPairPart].map(rightPairPart => {
                const symbol = generateSymbol(exchange.value, leftPairPart, rightPairPart);
                return {
                    symbol: symbol.short,
                    full_name: symbol.full,
                    description: symbol.short,
                    exchange: exchange.value,
                    type: 'crypto',
                };
            });
            allSymbols = [...allSymbols, ...symbols];
        }
    }
    return allSymbols;
}

export default {
    history: history,
   
    onReady: (callback) => {
        console.log('[onReady]: Method call');
        setTimeout(() => callback(configurationData));
    },

    searchSymbols: async (
        userInput,
        exchange,
        symbolType,
        onResultReadyCallback,
    ) => {
        console.log('[searchSymbols]: Method call');
        const symbols = await getAllSymbols();
        const newSymbols = symbols.filter(symbol => {
            const isExchangeValid = exchange === '' || symbol.exchange === exchange;
            const isFullSymbolContainsInput = symbol.full_name
                .toLowerCase()
                .indexOf(userInput.toLowerCase()) !== -1;
            return isExchangeValid && isFullSymbolContainsInput;
        });
        onResultReadyCallback(newSymbols);
    },

    resolveSymbol: async (
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback,
    ) => {
        console.log('[resolveSymbol]: Method call', symbolName);
        const symbols = await getAllSymbols();
        const symbolItem = symbols.find(({
            full_name,
        }) => full_name === symbolName);
        if (!symbolItem) {
            console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
            onResolveErrorCallback('cannot resolve symbol');
            return;
        }
        
        const symbolInfo = {
            full_name: symbolItem.full_name,
            ticker: symbolItem.full_name,
            symbol: symbolItem.symbol,
            name: symbolItem.symbol,
            description: symbolItem.description,
            type: symbolItem.type,
            session: '24x7',
            timezone: 'UTC',
            exchange: symbolItem.exchange,
            minmov: 1,
            pricescale: 100,
            has_no_volume: false,
            supported_resolutions: configurationData.supported_resolutions,
            has_intraday: true,
            has_daily: true,
            has_weekly_and_monthly: true,
            has_empty_bars: true,
            volume_precision: 10,
            data_status: 'streaming'
        };
        
        console.log('[resolveSymbol]: Symbol resolved', symbolInfo);
        onSymbolResolvedCallback(symbolInfo);
    },
    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        
        const { from, to, firstDataRequest } = periodParams;
        console.log('[getBars]: Method call', symbolInfo, resolution, from, to);
        const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
        console.log(symbolInfo)
        var params = {
            symbol: symbolInfo.symbol,
            interval: resolution,
            startTime : from ? (from * 1000) : '',
            endTime: to ? (to * 1000) : '',
            limit: 1500
        };
        
        
       
		try {
			const data = await makeApiRequest(params);
            console.log(data)
            
			if (data.Response && data.Response === 'Error' || data.data.length === 0) {
				// "noData" should be set if there is no data in the requested period.
				onHistoryCallback([], {
					noData: true,
				});
				return;
			}
            
			let bars = [];
            
  			data.data.map(bar => {
                for(var i = 0; i < bar.length; i++)
                {
                    bar[i] = bar[i]*1;
                }
				if (bar[0]/1000 >= from && bar[0]/1000 < to) {
					bars = [...bars, {
						time: bar[0], //TradingView requires bar time in ms
						low: bar[3],
						high: bar[2],
						open: bar[1],
						close: bar[4],
						volume: parseFloat(bar[5])
					}];
				}
			});
			if (firstDataRequest) {
                var lastBar = bars[bars.length - 1]
                history[symbolInfo.full_name] = {lastBar: lastBar}
                history['symbol'] = symbolInfo.symbol
				lastBarsCache.set(symbolInfo.full_name, {
					...bars[bars.length - 1],
				});
			}
			console.log(`[getBars]: returned ${bars.length} bar(s)`);
			onHistoryCallback(bars, {
				noData: false,
			});
		} catch (error) {
			console.log('[getBars]: Get error', error);
			onErrorCallback(error);
		}
    },
    
    subscribeBars: (
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscribeUID,
        onResetCacheNeededCallback,
    ) => {
        console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID);
        subscribeOnStream(
            symbolInfo,
            resolution,
            onRealtimeCallback,
            subscribeUID,
            onResetCacheNeededCallback,
            lastBarsCache.get(symbolInfo.full_name),
        );
    },
    unsubscribeBars: (subscriberUID) => {
        console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
        unsubscribeFromStream(subscriberUID);
    },
    //getVolumeProfileResolutionForPeriod:(currentResolution, from, to, symbolInfo),
};

