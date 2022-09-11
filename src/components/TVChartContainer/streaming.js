import Datafeed from './datafeed.js'
import {
	makeApiRequest,
	generateSymbol,
	parseFullSymbol,
} from './helpers.js';

import { io } from "socket.io-client";
const socket_url = 'https://socket.la-bit.com:2083/'
const socket = io(socket_url, {
	transports: ['websocket', 'polling', 'flashsocket']
})
const channelToSubscription = new Map();


socket.on('connect', () => {
	//console.log('[socket] Connected');
});

socket.on('disconnect', (reason) => {
	//console.log('[socket] Disconnected:', reason);
});

socket.on('error', (error) => {
	//console.log('[socket] Error:', error);
});

socket.on('m', async data => {
	//console.log('[socket] Message:', data);
	//const tradePrice = parseFloat(data.Chart_data.price);
	// const highPrice = parseFloat(data.Chart_data.high);
	// const lowPrice = parseFloat(data.Chart_data.low);
	// const openPrice = parseFloat(data.Chart_data.price);
	const tradeTime = parseInt(data.Chart_data.ts);
	const tradevolume = parseFloat(data.Chart_data.volume);
	const channelString = `0~LaBit~${data.Chart_data.symbol}`;
	const subscriptionItem = channelToSubscription.get(channelString);
	//console.log(channelString)
	if (subscriptionItem === undefined) {
		return;
	}
	const lastDailyBar = subscriptionItem.lastDailyBar;
	const resolution = subscriptionItem.resolution;
	//console.log('resolution-----------------------',resolution)
	const symbolInfo = subscriptionItem.symbolInfo;
	//const nextDailyBarTime = getNextDailyBarTime(tradeTime, lastDailyBar.time, resolution);

	//console.log(tradeTime, nextDailyBarTime, (tradeTime - nextDailyBarTime) / 1000)
	//let cha = (tradeTime - lastDailyBar.time)
	//console.log("cha---2", cha)
	//console.log("candle---2", data.Chart_data.candle1)
	const candle1 = data.Chart_data.candle1;
	const candle2 = data.Chart_data.candle2;
	let resolution_chk;
	if (resolution.includes('D')) {
		// 1 day in minutes === 1440
		resolution_chk = 1440
	} else if (resolution.includes('W')) {
		// 1 week in minutes === 10080
		resolution_chk = 10080
	} else if (resolution.includes('M')) {
		// 1 month in minutes === 40320
		resolution_chk = 40320
	} else {
		resolution_chk = resolution;
	}
	var coeff = resolution_chk * 60

	let last_sec = (tradeTime / 1000) % coeff;
	console.log('last_sec----------', last_sec, coeff)
	//if (tradeTime >= nextDailyBarTime && !resolution.includes("D") && !resolution.includes("W") && !resolution.includes("M")) {
	let bar_data
	if (resolution == 1 || last_sec < 10) {

		console.log('TimeStamp~~~~~~~~~~~', candle1[0])
		bar_data = {
			time: candle1[0], //TradingView requires bar time in ms
			low: candle1[3],
			high: candle1[2],
			open: candle1[1],
			close: candle1[4],
			volume: candle1[5]
		};

	} else {
		bar_data = {
			...lastDailyBar,
			high: Math.max(lastDailyBar.high, candle1[2]),
			low: Math.min(lastDailyBar.low, candle1[3]),
			close: candle1[4],
			volume: parseFloat(lastDailyBar.volume) + parseFloat(tradevolume),
		};
	}

	subscriptionItem.lastDailyBar = bar_data;
	subscriptionItem.handlers.forEach(handler => handler.callback(bar_data));

	// let bar_data2 = {
	// 	time: candle2[0], //TradingView requires bar time in ms
	// 	low: candle2[3],
	// 	high: candle2[2],
	// 	open: candle2[1],
	// 	close: candle2[4],
	// 	volume: candle2[5]
	// };
	// subscriptionItem.lastDailyBar = bar_data2;
	// subscriptionItem.handlers.forEach(handler => handler.callback(bar_data2));

	// send data to every subscriber of that symbol

	console.log('subscriptionItem--------', subscriptionItem)


	// bar_data = [...bar_data, {
	// 	time: candle2[0], //TradingView requires bar time in ms
	// 	low: candle2[3],
	// 	high: candle2[2],
	// 	open: candle2[1],
	// 	close: candle2[4],
	// 	volume: parseFloat(candle2[5])
	// }];



	// if (tradeTime >= nextDailyBarTime || cha < 0) {
	// 	var params = {
	//         symbol: Datafeed.history.symbol,
	//         interval: resolution,
	//         limit: 1
	//     };
	// 	let bar_data;
	// 	const data = await makeApiRequest(params);
	// 	console.log('getdata', data)
	// 	data.data.map(x => {
	// 			bar_data = {
	// 				time: x[6]+1, //TradingView requires bar time in ms
	// 				low: x[3],
	// 				high: x[2],
	// 				open: x[1],
	// 				close: x[4],
	// 				volume: parseFloat(x[5])
	// 			};

	// 	});
	// 	bar = bar_data;
	// 	console.log('[socket] Generate new bar', bar);
	// } else {

	// 	bar = {
	// 		...lastDailyBar,
	// 		high: Math.max(lastDailyBar.high, tradePrice),
	// 		low: Math.min(lastDailyBar.low, tradePrice),
	// 		close: tradePrice,
	// 		volume: parseFloat(lastDailyBar.volume) + parseFloat(tradevolume),
	// 	};
	// 	console.log('[socket] Update the latest bar by price1', bar);
	// }

});

// function getNextDailyBarTime(tradeTime, barTime, resolution) {
// 	console.log(tradeTime, barTime, resolution)
// 		var coeff = resolution * 60
// 		// console.log('coeff', coeff)
// 		// var rounded = Math.floor(tradeTime / 1000 / coeff) * coeff
// 		// console.log('rounded', rounded)
// 		// var chk_time = (rounded + coeff) * 1000;
// 		// console.log('chk_time111', chk_time)
// 		barTime = barTime + (coeff * 1000);
// 		console.log("barTime", barTime)
// 	return barTime 
// }

function getNextDailyBarTime(tradeTime, barTime, resolution) {
	console.log('resolution', resolution)
	if (resolution.includes('D')) {
		// 1 day in minutes === 1440
		resolution = 1440
	} else if (resolution.includes('W')) {
		// 1 week in minutes === 10080
		resolution = 10080
	} else if (resolution.includes('M')) {
		// 1 month in minutes === 40320
		resolution = 40320
	}
	let coeff = resolution * 60
	// const date = new Date();
	// console.log('date', date)
	// console.log('date333', barTime + (coeff * 1000))
	// let data2 = date.getTime();

	console.log('coeff', coeff)
	console.log('barTime', barTime)
	// console.log('data2', data2)
	let cha = (tradeTime - barTime) / 1000
	console.log('cha', cha, coeff)
	let re_barTime;
	if (cha < 0 || (cha - 10) > coeff) {
		re_barTime = barTime;
	} else {
		re_barTime = barTime + (coeff * 1000);
	}
	return re_barTime;
	// date.setDate(date.getDate() + 1);
	// let data2 = date.getTime();
	// console.log('data2', data2)
	// return date.getTime();
}

export function subscribeOnStream(
	symbolInfo,
	resolution,
	onRealtimeCallback,
	subscribeUID,
	onResetCacheNeededCallback,
	lastDailyBar,
) {
	const channelString = `0~LaBit~${symbolInfo.symbol}`;
	//console.log(channelString)
	const handler = {
		id: subscribeUID,
		callback: onRealtimeCallback,
	};
	console.log(resolution, 111)
	console.log(channelString, 112)
	let subscriptionItem = channelToSubscription.get(channelString);
	console.log(subscriptionItem, 113)
	if (subscriptionItem) {
		// already subscribed to the channel, use the existing subscription

		// console.log(resolution, 114)
		// if (resolution.includes('D')) {
		// 	// 1 day in minutes === 1440
		// 	resolution = 1440
		// } else if (resolution.includes('W')) {
		// 	// 1 week in minutes === 10080
		// 	resolution = 10080
		// } else if (resolution.includes('M')) {
		// 	// 1 month in minutes === 40320
		// 	resolution = 40320
		// }
		// var coeff = resolution * 60
		// let timestamp =  new Date().getTime();
		// var rounded = Math.floor(timestamp / 1000 / coeff) * coeff
		// var nexttime = (rounded) * 1000;
		// console.log('chk_time112', nexttime)
		console.log('lastDailyBar', lastDailyBar)

		subscriptionItem.handlers.push(handler);
		subscriptionItem.subscribeUID = subscribeUID;
		subscriptionItem.resolution = resolution;
		subscriptionItem.lastDailyBar = Datafeed.history[symbolInfo.full_name].lastBar;
		subscriptionItem.symbolInfo = symbolInfo;
		console.log('subscriptionItem : ', subscriptionItem)

		return;
	}
	lastDailyBar = Datafeed.history[symbolInfo.full_name].lastBar;
	subscriptionItem = {
		subscribeUID,
		resolution,
		lastDailyBar,
		handlers: [handler],
	};
	channelToSubscription.set(channelString, subscriptionItem);
	console.log('[subscribeBars]: Subscribe to streaming. Channel:', channelString);
	socket.emit('trade', { symbol: symbolInfo.symbol, })
	//socket.emit('SubAdd', { subs: [channelString] });
}

export function unsubscribeFromStream(subscriberUID) {
	// find a subscription with id === subscriberUID
	for (const channelString of channelToSubscription.keys()) {
		const subscriptionItem = channelToSubscription.get(channelString);
		const handlerIndex = subscriptionItem.handlers
			.findIndex(handler => handler.id === subscriberUID);

		if (handlerIndex !== -1) {
			// remove from handlers
			subscriptionItem.handlers.splice(handlerIndex, 1);

			if (subscriptionItem.handlers.length === 0) {
				// unsubscribe from the channel, if it was the last handler
				console.log('[unsubscribeBars]: Unsubscribe from streaming. Channel:', channelString);
				socket.emit('SubRemove', { subs: [channelString] });
				channelToSubscription.delete(channelString);
				break;
			}
		}
	}
}
