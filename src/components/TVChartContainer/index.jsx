import * as React from 'react';
import './index.css';
import { widget, onReady } from '../../charting_library';
import Datafeed from './datafeed';

function getLanguageFromURL() {
	const regex = new RegExp('[\\?&]lang=([^&#]*)');
	const results = regex.exec(window.location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

export class TVChartContainer extends React.PureComponent {
	static defaultProps = {
		symbol: 'LaBit:BTCUSDT',
		interval: '15',
		libraryPath: '/charting_library/',
		chartsStorageUrl: 'https://saveload.tradingview.com',
		chartsStorageApiVersion: '1.1',
		clientId: 'tradingview.com',
		userId: 'public_user_id',
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
		};

		const tvWidget = new widget(widgetOptions);
		this.tvWidget = tvWidget;

		tvWidget.onChartReady(() => {
			tvWidget.headerReady().then(() => {
				const button = tvWidget.createButton();
				button.setAttribute('title', 'Click to show a notification popup');
				button.classList.add('apply-common-tooltip');
				button.addEventListener('click', () => tvWidget.showNoticeDialog({
					title: 'Notification',
					body: 'TradingView Charting Library API works correctly',
					callback: () => {
						console.log('Noticed!');
					},
				}));

				button.innerHTML = 'Check API';
			});
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
				ref={ this.ref }
				className={ 'TVChartContainer' }
			/>
		);
	}
}
