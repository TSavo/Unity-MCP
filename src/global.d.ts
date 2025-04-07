declare global {
  namespace NodeJS {
    interface Global {
      gc?: () => void;
    }
  }
}
