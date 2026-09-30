declare module 'virtual:swaplab/catalogue' {
  /** The simulation's copy of the data, built by scripts/vite-plugin-catalogue.ts. */
  const catalogue: import('./data/sim-data').SimCatalogue;
  export default catalogue;
}
