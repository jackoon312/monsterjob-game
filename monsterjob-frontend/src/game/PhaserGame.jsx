import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig, wholeNumberZoom } from './config';

// This is the trickiest part of a Phaser + React integration: Phaser wants to
// own a persistent canvas and its own game loop, while React wants to
// re-render on every state change. The pattern here is to create the Phaser
// game ONCE (on mount), store it in a ref (not React state, so it doesn't
// trigger re-renders), and destroy it on unmount. Data flows INTO Phaser via
// game.registry (set whenever officeData/officeTier change), not via React
// re-rendering the canvas.
//
// officeData shape: { idle: Creature[], byCategory: { Labor: Creature[], ... } }
const PhaserGame = ({ officeData, officeTier }) => {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return; // guard against double-mount in React StrictMode

    const containerId = 'phaser-container';
    gameRef.current = new Phaser.Game(createGameConfig(containerId));

    // Keep the canvas at a whole-number zoom of its native 480x320 (see
    // config.js). Width comes from the panel the canvas sits in; height is
    // capped so the whole canvas stays visible in the window.
    const panel = containerRef.current?.parentElement;
    const applyZoom = () => {
      const game = gameRef.current;
      if (!game || !panel) return;
      const style = window.getComputedStyle(panel);
      const availableWidth = panel.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const availableHeight = window.innerHeight - 140;
      const zoom = wholeNumberZoom(availableWidth, availableHeight);
      if (game.scale.zoom !== zoom) game.scale.setZoom(zoom);
    };
    applyZoom();
    const observer = panel ? new ResizeObserver(applyZoom) : null;
    observer?.observe(panel);
    window.addEventListener('resize', applyZoom);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', applyZoom);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Push the latest office data AND office tier into Phaser's registry
  // whenever either changes, and restart whichever scene is currently
  // active so it redraws with the new data. If the player is inside a
  // category room (OfficeRoomScene), we have to re-pass its `category` init
  // param or the restart would lose track of which room it is.
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    game.registry.set('officeIdle', officeData?.idle || []);
    game.registry.set('officeByCategory', officeData?.byCategory || {});
    game.registry.set('officeJobsByCategory', officeData?.jobsByCategory || {});
    game.registry.set('unlockedAchievementCount', officeData?.unlockedAchievementCount || 0);
    game.registry.set('totalAchievementCount', officeData?.totalAchievementCount || 0);
    game.registry.set('officeTier', officeTier || 1);

    const bootScene = game.scene.getScene('BootScene');
    if (bootScene && bootScene.scene.isActive()) {
      bootScene.scene.restart();
      return;
    }

    const roomScene = game.scene.getScene('OfficeRoomScene');
    if (roomScene && roomScene.scene.isActive()) {
      roomScene.scene.restart({ category: roomScene.category });
    }
  }, [officeData, officeTier]);

  return <div id="phaser-container" ref={containerRef} />;
};

export default PhaserGame;
