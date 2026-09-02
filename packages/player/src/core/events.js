/**
 * FocusFlow Event Management System
 * Handles keyboard shortcuts, tab clicks, play/pause buttons, and window resize events
 */

export class EventManager {
  constructor(player) {
    this.player = player;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  bind() {
    if (this.player.enableKeyboard !== false) {
      window.addEventListener('keydown', this.handleKeyDown);
    }
    window.addEventListener('resize', this.handleResize);
  }

  unbind() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
  }

  handleKeyDown(e) {
    // Ignore input events when focusing on text fields
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    // Toggle HUD debug overlay on Ctrl+Shift+D or Cmd+Shift+D
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      this.player.toggleDebugMode();
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        this.player.next();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.player.prev();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        this.player.togglePlay();
        break;
      case 'Home':
        e.preventDefault();
        this.player.goToStep(0);
        break;
      case 'End':
        e.preventDefault();
        this.player.goToStep(this.player.dsl.scenes.length - 1);
        break;
      case 'Escape':
        if (this.player.isDebugActive) {
          this.player.toggleDebugMode(false);
        }
        break;
    }
  }

  handleResize() {
    // Notify player to update viewport bounding math if needed
    if (this.player.hud) {
      this.player.hud.updateBounds();
    }
  }
}
