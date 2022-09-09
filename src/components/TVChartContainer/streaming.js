import { io } from "socket.io-client";
const socket_url = 'https://socket.la-bit.com:2083/'
const socket = io(socket_url, {
	transports: ['websocket', 'polling', 'flashsocket']
})
const channelToSubscription = new Map();
socket.emit('trade', { symbol: 'BTCUSDT', })

socket.on('connect', () => {
	console.log('[socket] Connected');
});

socket.on('disconnect', (reason) => {
	console.log('[socket] Disconnected:', reason);
});

socket.on('error', (error) => {
	console.log('[socket] Error:', error);
});

socket.on('m', data => {
	console.log('[socket] Message:', data);

	const tradePrice = parseFloat(data.Chart_data.price);
	const tradeTime = parseInt(data.Chart_data.ts);
	const tradevolume = parseFloat(data.Chart_data.volume);
	const channelString = `0~LaBit~${data.Chart_data.symbol}`;
	const subscriptionItem = channelToSubscription.get(channelString);
	console.log(channelString)
	if (subscriptionItem === undefined) {
		return;
	}
	const lastDailyBar = subscriptionItem.lastDailyBar;
	const resolution = subscriptionItem.resolution;
	const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time, resolution);

	let bar;
	console.log(tradeTime, nextDailyBarTime, (tradeTime - nextDailyBarTime) / 1000)
	if (tradeTime >= nextDailyBarTime) {
		bar = {
			time: nextDailyBarTime,
			open: tradePrice,
			high: tradePrice,
			low: tradePrice,
			close: tradePrice,
			volume: tradevolume,
		};
		console.log('[socket] Generate new bar', bar);
	} else {

		bar = {
			...lastDailyBar,
			high: Math.max(lastDailyBar.high, tradePrice),
			low: Math.min(lastDailyBar.low, tradePrice),
			close: tradePrice,
			volume: lastDailyBar.volume + tradevolume,
		};
		console.log('[socket] Update the latest bar by price', bar);
	}

	subscriptionItem.lastDailyBar = bar;

	// send data to every subscriber of that symbol
	subscriptionItem.handlers.forEach(handler => handler.callback(bar));
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

function getNextDailyBarTime(barTime, resolution) {
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
	
	var coeff = resolution * 60
	const date = new Date(barTime + (coeff * 1000));
	console.log('date', date)
	console.log('date333', barTime + (coeff * 1000))
	let data2 = date.getTime();
	console.log('coeff', coeff)
	console.log('barTime', barTime)
	console.log('data2', data2)
	return date.getTime();

	

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
		subscriptionItem.lastDailyBar = lastDailyBar;
		console.log('subscriptionItem : ', subscriptionItem)
		return;
	}
	subscriptionItem = {
		subscribeUID,
		resolution,
		lastDailyBar,
		handlers: [handler],
	};
	channelToSubscription.set(channelString, subscriptionItem);
	console.log('[subscribeBars]: Subscribe to streaming. Channel:', channelString);
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
