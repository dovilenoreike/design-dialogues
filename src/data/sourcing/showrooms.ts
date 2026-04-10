import type { ShowroomBrand } from "./types";

export const showroomBrands: ShowroomBrand[] = [
  {
    id: "impeka",
    name: "Impeka",
    surfaceCategories:  ["front", "worktop"],
    isPartner: false,
    locations: {
      vilnius: { address: "Vytenio g. 48, Vilnius" },
      kaunas: { address: "Kauno g. 22, Ramučiai, Kaunas" },
      klaipeda: { address: "Birutės g. 22-315, Klaipėda" },
    },
    url: "https://impekahome.lt/",
  },
  {
    id: "trukme",
    name: "Trukmė",
    surfaceCategories: ["front", "worktop"],
    isPartner: false,
    locations: {
      vilnius: { address: "Verkių g. 44, (PC Unideco, II aukštas), Vilnius" },
      kaunas: { address: "Pramonės pr. 8e, (NIC namų idėjų centras), Kaunas" },
      klaipeda: { address: "Minijos g. 42, (NIC namų Idėjų Centras), Klaipėda" },
    },
    url: "https://trukme.lt/",
  },
  {
    id: "solido-grindys",
    name: "Solido Grindys",
    surfaceCategories: ["floor"],
    isPartner: false,
    locations: {
      vilnius: { address: " P. Lukšio g. 32, Vilnius (DOMUS Galerija)" },
      kaunas: { address: "Juozapavičiaus pr. 31-7, Kaunas" },
      klaipeda: { address: "Liepų g. 83, Klaipėda" },
    },
    url: "https://solido.lt/",
  },
    {
    id: "magnus-grindys",
    name: "Magnus Grindys",
    surfaceCategories: ["floor"],
    isDelivery: true,
    locations: {
      vilnius: { phone: "+370 628 34074", email: "info@magnusgrindys.lt" },
    },
    url: "https://magnusgrindys.lt/",
  },
  {
    id: "linea",
    name: "Linea",
    surfaceCategories: ["tile"],
    isPartner: false,
    locations: {
      vilnius: { address: "Kęstučio g. 53, Vilnius" },
      kaunas: { address: "Savanorių pr. 170, Kaunas" },
      klaipeda: { address: "Taikos pr. 56, Klaipėda (HELIOS Galerija)" },
    },
    url: "https://linea.lt/",
  },
];
