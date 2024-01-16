import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import CalHeatmap from 'cal-heatmap';

import 'node_modules/cal-heatmap/dist/cal-heatmap.css';

import LegendLite from 'cal-heatmap/plugins/LegendLite';
import CalendarLabel from 'cal-heatmap/plugins/CalendarLabel';
import Tooltip from 'cal-heatmap/plugins/Tooltip';

import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';

dayjs.extend(localeData);

dayjs().localeData();

export const VIEW_TYPE = 'activity-heatmap-view';

export class ActivityHeatmapView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return 'Activity Heatmap';
	}

	async onOpen() {
		const files = this.loadAllNotes();
		const aggregatedData = this.aggregateData(files);
		const heatmapData = this.prepareHeatmapData(aggregatedData);

		const container = this.containerEl.children[1];
		container.empty();
		container.createEl('h1', { text: 'Activity Heatmap' });

		const heatmapContainer = container.createDiv();
		heatmapContainer.style.borderRadius = '3px';
		heatmapContainer.style.padding = '1rem';
		heatmapContainer.style.overflow = 'hidden';

		const heatmap = heatmapContainer.createDiv();
		heatmap.id = 'cal-heatmap';
		heatmap.style.marginBottom = '1rem';

		const legendContainer = heatmapContainer.createDiv();
		legendContainer.style.float = 'left';
		legendContainer.style.fontSize = '12px';
		const lessSpan = legendContainer.createSpan();
		lessSpan.style.color = '#768390';
		lessSpan.innerText = 'Less';
		const legend = legendContainer.createDiv();
		legend.id = 'cal-heatmap-legend';
		legend.style.display = 'inline-block';
		legend.style.margin = '0 4px';
		const moreSpan = legendContainer.createSpan();
		moreSpan.style.color = '#768390';
		moreSpan.innerText = 'More';

		const cal = new CalHeatmap();
		cal.paint(
			{
				data: {
					source: heatmapData,
					x: 'x',
					y: 'y',
				},
				date: { start: new Date('2024-01-01'), timezone: 'utc' },
				range: 12,
				scale: {
					color: {
						type: 'threshold',
						range: ['#4dd05a', '#37a446', '#166b34', '#14432a'],
						domain: [10, 20, 30],
					},
				},
				domain: {
					type: 'month',
					gutter: 4,
					label: { text: 'MMM', textAlign: 'start', position: 'top' },
				},
				subDomain: { type: 'ghDay', radius: 2, width: 11, height: 11, gutter: 4 },
			},
			[
				[
					Tooltip,
					{
						text: function (date: dayjs.Date, value: number, dayjsDate: dayjs.Date) {
							return (
								(value ? value : 'No') +
								' contributions on ' +
								dayjsDate.format('YYYY-MM-DD')
							);
						},
					},
				],
				[
					LegendLite,
					{
						includeBlank: true,
						itemSelector: '#cal-heatmap-legend',
						radius: 2,
						width: 11,
						height: 11,
						gutter: 4,
					},
				],
				[
					CalendarLabel,
					{
						width: 30,
						textAlign: 'start',
						text: () => dayjs.weekdaysShort().map((d, i) => (i % 2 == 0 ? '' : d)),
						padding: [25, 0, 0, 0],
					},
				],
			],
		);
	}

	async onClose() {}

	isCurrentYear(date: dayjs.Dayjs): boolean {
		const currentYear = dayjs().year();
		return date.year() === currentYear;
	}

	loadAllNotes(): TFile[] {
		const files = this.app.vault.getFiles();
		return files.filter(
			(file) => file.extension === 'md' && this.isCurrentYear(dayjs(file.stat.ctime)),
		);
	}

	aggregateData(files: TFile[]): { [key: string]: number } {
		const dateCounts: { [key: string]: number } = {};

		files.forEach((file) => {
			const creationDate = dayjs(file.stat.ctime);
			const formattedDate = dayjs(creationDate).format('YYYY-MM-DD');

			if (this.isCurrentYear(creationDate)) {
				if (!dateCounts[formattedDate]) {
					dateCounts[formattedDate] = 1;
				} else {
					dateCounts[formattedDate]++;
				}
			}
		});
		return dateCounts;
	}

	prepareHeatmapData(
		dateCounts: { [key: string]: string | number | undefined } | ArrayLike<unknown>,
	): { [key: string]: string | number | undefined }[] {
		return Object.entries(dateCounts).map(
			(entry): { [key: string]: string | number | undefined } => {
				return {
					x: entry[0],
					y: entry[1],
				};
			},
		);
	}
}
