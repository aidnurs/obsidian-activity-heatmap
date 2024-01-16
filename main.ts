import { Plugin } from 'obsidian';
import { ActivityHeatmapView, VIEW_TYPE } from './heatmap-view';

import { WorkspaceLeaf } from 'obsidian';

export default class ActivityHeatmapPlugin extends Plugin {
	async onload() {
		this.registerView(VIEW_TYPE, (leaf) => new ActivityHeatmapView(leaf));

		this.addRibbonIcon('flame', 'Activity Heatmap', (evt: MouseEvent) => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-heatmap-view',
			name: 'Open Heatmap View',
			callback: () => {
				this.activateView();
			},
		});
	}

	onunload() {}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			leaf = workspace.getLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}
}
