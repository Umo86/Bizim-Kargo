import { describe, expect, it } from "vitest";
import { resolveZone, TR_ZONES, UK_ZONES, ZONE_LABELS } from "../../zones";
import type { ZoneCode } from "../../types";

describe("resolveZone — United Kingdom", () => {
  it("maps ordinary postcodes to the mainland", () => {
    expect(resolveZone("GB", "SW1A 1AA")).toBe("GB-MAINLAND");
    expect(resolveZone("GB", "M1 1AE")).toBe("GB-MAINLAND");
    expect(resolveZone("GB", "EC1A 1BB")).toBe("GB-MAINLAND");
    expect(resolveZone("GB", "B33 8TH")).toBe("GB-MAINLAND");
    expect(resolveZone("GB", "CF10 1EP")).toBe("GB-MAINLAND");
  });

  it("maps BT to Northern Ireland", () => {
    expect(resolveZone("GB", "BT7 1NN")).toBe("GB-NI");
  });

  it("maps island areas to GB-ISLANDS", () => {
    expect(resolveZone("GB", "IM1 2AB")).toBe("GB-ISLANDS");
    expect(resolveZone("GB", "GY1 1WR")).toBe("GB-ISLANDS");
    expect(resolveZone("GB", "JE2 3AB")).toBe("GB-ISLANDS");
    expect(resolveZone("GB", "HS1 2XG")).toBe("GB-ISLANDS");
    expect(resolveZone("GB", "ZE1 0AB")).toBe("GB-ISLANDS");
  });

  it("maps IV/KW/PH to the Highlands", () => {
    expect(resolveZone("GB", "IV2 3AA")).toBe("GB-HIGHLANDS");
    expect(resolveZone("GB", "KW1 4YT")).toBe("GB-HIGHLANDS");
    expect(resolveZone("GB", "PH33 6SN")).toBe("GB-HIGHLANDS");
  });

  it("is case and whitespace tolerant", () => {
    expect(resolveZone("GB", "bt71nn")).toBe("GB-NI");
    expect(resolveZone("GB", "  iv2 3aa  ")).toBe("GB-HIGHLANDS");
    expect(resolveZone("GB", "im1-2ab")).toBe("GB-ISLANDS");
    expect(resolveZone("GB", "sw1a1aa")).toBe("GB-MAINLAND");
  });

  it("does not confuse single-letter areas with special two-letter areas", () => {
    // B1 (Birmingham) must not match BT; I is not a postcode area at all.
    expect(resolveZone("GB", "B1 1AA")).toBe("GB-MAINLAND");
    expect(resolveZone("GB", "G1 1AA")).toBe("GB-MAINLAND");
  });

  it("falls back to mainland for non-postcode-shaped input", () => {
    expect(resolveZone("GB", "London")).toBe("GB-MAINLAND");
  });
});

describe("resolveZone — Turkey", () => {
  it("is tolerant of Turkish characters and casing for İstanbul", () => {
    expect(resolveZone("TR", "İstanbul")).toBe("TR-MARMARA");
    expect(resolveZone("TR", "Istanbul")).toBe("TR-MARMARA");
    expect(resolveZone("TR", "istanbul")).toBe("TR-MARMARA");
    expect(resolveZone("TR", "ISTANBUL")).toBe("TR-MARMARA");
    expect(resolveZone("TR", "İSTANBUL")).toBe("TR-MARMARA");
  });

  it("matches the il from 'il / ilçe' style input", () => {
    expect(resolveZone("TR", "İstanbul / Kadıköy")).toBe("TR-MARMARA");
    expect(resolveZone("TR", "İzmir / Bornova")).toBe("TR-AEGEAN");
    expect(resolveZone("TR", "Ankara / Çankaya")).toBe("TR-ANKARA");
  });

  it("still resolves when the il comes second", () => {
    expect(resolveZone("TR", "Kadıköy / İstanbul")).toBe("TR-MARMARA");
    expect(resolveZone("TR", "Bornova, İzmir")).toBe("TR-AEGEAN");
  });

  it("maps representative provinces of every zone", () => {
    const cases: Array<[string, ZoneCode]> = [
      // Marmara
      ["Bursa", "TR-MARMARA"],
      ["Tekirdağ", "TR-MARMARA"],
      ["Kocaeli", "TR-MARMARA"],
      // Ankara
      ["Ankara", "TR-ANKARA"],
      // Aegean
      ["İzmir", "TR-AEGEAN"],
      ["Muğla", "TR-AEGEAN"],
      ["Afyonkarahisar", "TR-AEGEAN"],
      // Mediterranean
      ["Antalya", "TR-MED"],
      ["Mersin", "TR-MED"],
      ["Kahramanmaraş", "TR-MED"],
      ["Hatay", "TR-MED"],
      // Central Anatolia
      ["Konya", "TR-CENTRAL"],
      ["Kayseri", "TR-CENTRAL"],
      ["Eskişehir", "TR-CENTRAL"],
      ["Sivas", "TR-CENTRAL"],
      // Black Sea
      ["Trabzon", "TR-BLACKSEA"],
      ["Samsun", "TR-BLACKSEA"],
      ["Rize", "TR-BLACKSEA"],
      ["Düzce", "TR-BLACKSEA"],
      // East & Southeast
      ["Erzurum", "TR-EAST"],
      ["Van", "TR-EAST"],
      ["Diyarbakır", "TR-EAST"],
      ["Şanlıurfa", "TR-EAST"],
      ["Gaziantep", "TR-EAST"],
      ["Ağrı", "TR-EAST"],
      ["Iğdır", "TR-EAST"],
      ["Hakkâri", "TR-EAST"],
    ];
    for (const [input, zone] of cases) {
      expect(resolveZone("TR", input), input).toBe(zone);
    }
  });

  it("resolves common short spellings", () => {
    expect(resolveZone("TR", "Afyon")).toBe("TR-AEGEAN");
    expect(resolveZone("TR", "Urfa")).toBe("TR-EAST");
    expect(resolveZone("TR", "Antep")).toBe("TR-EAST");
    expect(resolveZone("TR", "Hakkari")).toBe("TR-EAST");
  });

  it("falls back to TR-CENTRAL for unrecognised input", () => {
    expect(resolveZone("TR", "Atlantis")).toBe("TR-CENTRAL");
    expect(resolveZone("TR", "")).toBe("TR-CENTRAL");
    expect(resolveZone("TR", "???")).toBe("TR-CENTRAL");
  });
});

describe("zone metadata", () => {
  it("labels every zone code", () => {
    const allZones = [...UK_ZONES, ...TR_ZONES];
    expect(UK_ZONES).toHaveLength(4);
    expect(TR_ZONES).toHaveLength(7);
    for (const zone of allZones) {
      expect(ZONE_LABELS[zone]).toBeTruthy();
    }
    // The label record covers exactly the eleven codes.
    expect(Object.keys(ZONE_LABELS)).toHaveLength(11);
  });
});
