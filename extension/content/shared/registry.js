globalThis.PsaExtractRegistry = {
  adapters: [],
  register(adapter) {
    this.adapters.push(adapter);
  },
};
