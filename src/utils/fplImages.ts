/** Returns the shirt/jersey PNG URL for a given team code.
 *  GK variant uses a different suffix from the FPL CDN. */
export function shirtUrl(teamCode: number, isGK = false): string {
  const name = isGK
    ? `shirt_${teamCode}_1-66`
    : `shirt_${teamCode}-66`
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/${name}.png`
}

/** Returns the team badge/crest PNG URL for a given team code. */
export function crestUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/50/t${teamCode}.png`
}
