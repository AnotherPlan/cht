import * as React from 'react';
import './index.css';
import { widget } from '../../charting_library';
import Datafeed from './datafeed';


function getLanguageFromURL() {
	const regex = new RegExp('[\\?&]lang=([^&#]*)');
	const results = regex.exec(window.location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
const url_symbol = 'BTCUSDT';
export class TVChartContainer extends React.PureComponent {
	static defaultProps = {
		symbol: 'LaBit:'+url_symbol,
		interval: '15',
		libraryPath: '/charting_library/',
		fullscreen: false,
		autosize: true,
		studiesOverrides: {},
		theme: 'Dark'
	};
	
	tvWidget = null;

	constructor(props) {
		super(props);

		this.ref = React.createRef();
	}

	componentDidMount() {
		const widgetOptions = {
			symbol: this.props.symbol,
			// BEWARE: no trailing slash is expected in feed URL
			datafeed: Datafeed,
			interval: this.props.interval,
			container: this.ref.current,
			library_path: this.props.libraryPath,
			locale: getLanguageFromURL() || 'en',
			fullscreen: this.props.fullscreen,
			autosize: this.props.autosize,
			theme: this.props.theme,
			timezone: 'Asia/Seoul',
			disabled_features: ['use_localstorage_for_settings', 'header_symbol_search','time_frames'],
			enabled_features: ['items_favoriting'],
			favorites: {
                intervals: ["1", "5", "15", "30", "D"],
            },
		};

		const tvWidget = new widget(widgetOptions);
		this.tvWidget = tvWidget;

		tvWidget.onChartReady(() => {
			// tvWidget.headerReady().then(() => {
			// 	const button = tvWidget.createButton();
			// 	button.setAttribute('title', 'Click to show a notification popup');
			// 	button.classList.add('apply-common-tooltip');
			// 	button.addEventListener('click', () => tvWidget.showNoticeDialog({
			// 		title: 'Notification',
			// 		body: 'TradingView Charting Library API works correctly',
			// 		callback: () => {
			// 			console.log('Noticed!');
			// 		},
			// 	}));

			// 	button.innerHTML = 'Check API';
			// });
			// tvWidget.activeChart().createExecutionShape()
			// 	.setText("@1,320.75 Limit Buy 1")
			// 	.setTooltip("@1,320.75 Limit Buy 1")
			// 	.setTextColor("rgba(0,255,0,0.5)")
			// 	.setArrowColor("#0F0")
			// 	.setDirection("buy")
			// 	.setTime(widget.activeChart().getVisibleRange().from)
			// 	.setPrice(20600);

			tvWidget.onContextMenu(function (price) {
				return [{
					position: "top",
					text: "First top menu item, price: " + price,
					click: function () { alert("First clicked."); }
				},
				{ text: "-", position: "top" },
				{ text: "-Objects Tree..." },
				{
					position: "top",
					text: "Second top menu item 2",
					click: function () { alert("Second clicked."); }
				}, {
					position: "bottom",
					text: "Bottom menu item",
					click: function () { alert("Third clicked."); }
				}];
			});

			tvWidget.chart().createPositionLine()
				.onClose(function() {
					this.remove();
				})
				.setLineColor("rgb(000, 051, 204)")
				.setBodyBorderColor("rgb(000, 051, 204)")
				.setBodyTextColor("rgb(000, 051, 204)")
				.setQuantityBorderColor("rgb(000, 051, 204)")
				.setQuantityBackgroundColor("rgb(000, 051, 204, 0.75)")
				.setCloseButtonIconColor("rgb(000, 051, 204)")
				.setCloseButtonBorderColor("rgb(000, 051, 204)")
				.setText("Long")
				.setQuantity("8.235")
				.setPrice(20000)
				.setExtendLeft(false)
				.setLineStyle(0)
				.setLineLength(25);
				
			tvWidget.chart().createPositionLine()
				.onClose(function() {
					this.remove();
				})
				.setLineColor("rgb(204, 000, 000)")
				.setBodyBorderColor("rgb(204, 000, 000)")
				.setBodyTextColor("rgb(204, 000, 000)")
				.setQuantityBorderColor("rgb(204, 000, 000)")
				.setQuantityBackgroundColor("rgb(204, 000, 000, 0.75)")
				.setCloseButtonIconColor("rgb(204, 000, 000)")
				.setCloseButtonBorderColor("rgb(204, 000, 000)")
				.setText("Short")
				.setQuantity("8.235")
				.setPrice(20600)
				.setExtendLeft(false)
				.setLineStyle(0)
				.setLineLength(5);
		});
	}
	
	componentWillUnmount() {
		if (this.tvWidget !== null) {
			this.tvWidget.remove();
			this.tvWidget = null;
		}
	}

	render() {
		return (
			<div
				ref={this.ref}
				className={'TVChartContainer'}
			/>
		);
	}
}
