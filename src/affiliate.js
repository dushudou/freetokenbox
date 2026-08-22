// 联盟营销（affiliate）配置
// ---------------------------------------------------------------
// 使用方法：注册对应平台账号后，把推广 ID/链接填进下方字段，重新部署即可生效，
// 无需改动其他代码。所有字段默认空 = 不启用任何联盟改写（站点外链保持纯 UTM）。
// 合规要求：启用任一联盟后，站内会自动在页脚显示联盟披露声明。
//
// 注册入口：
//   - Amazon Associates: https://affiliate-program.amazon.com
//   - CJ (Commission Junction): https://www.cj.com
//   - ShareASale: https://www.shareasale.com
//   - OpenRouter 返佣: https://openrouter.ai/settings (Referral)
// ---------------------------------------------------------------
export const AFFILIATE = {
  // 1) CJ / ShareASale 等「按域名整体替换」的商家推广链接
  //    格式：'目标域名' -> '推广链接'
  //    例：{ 'openrouter.ai': 'https://www.tkqlhce.com/click-123456-789012' }
  //    （在 CJ / ShareASale 后台生成商家专属推广链接后，把目标域名对应的链接填进来）
  rewrite: {},

  // 2) Amazon Associates 跟踪 ID（形如 'xxx-20'）
  //    启用后，站内所有 amazon.com / amazon.cn 外链会自动追加 ?tag=你的ID
  amazonTag: '',

  // 3) OpenRouter 官方返佣代码（形如 '你的ref代码'）
  //    启用后，站内 openrouter.ai 外链会自动追加 ?ref=你的代码
  openrouterRef: '',
}

// 是否已启用任一联盟（用于页脚披露声明）
export function affiliateActive() {
  return !!(
    (AFFILIATE.rewrite && Object.keys(AFFILIATE.rewrite).length) ||
    AFFILIATE.amazonTag ||
    AFFILIATE.openrouterRef
  )
}
