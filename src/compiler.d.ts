declare global {
  /**
   * package 包构建时的 CommitID
   */
  const __COMMIT_ID__: string
  /**
   * package 版本
   */
  const __VERSION__: string
  /**
   * 开发版标记
   */
  const __DEV__: boolean
}

export {}
