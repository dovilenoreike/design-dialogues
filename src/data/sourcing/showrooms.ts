import type { ShowroomBrand } from "./types";

export const showroomBrands: ShowroomBrand[] = [
  {
    id: "impeka",
    name: "Impeka",
    surfaceCategories: ["cabinet-fronts"],
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
    surfaceCategories: ["cabinet-fronts"],
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
    surfaceCategories: ["flooring"],
    isPartner: false,
    locations: {
      vilnius: { address: " P. Lukšio g. 32, Vilnius (DOMUS Galerija)" },
      kaunas: { address: "Juozapavičiaus pr. 31-7, Kaunas" },
      klaipeda: { address: "Liepų g. 83, Klaipėda" },
    },
    url: "https://solido.lt/",
  },
  {
    id: "jusu-salonas",
    name: "Jūsų Salonas",
    surfaceCategories: ["flooring"],
    isPartner: false,
    locations: {},
    // locations: {
    //   vilnius: { address: " P. Lukšio g. 32, Vilnius (DOMUS Galerija)" },
    //   kaunas: { address: "Juozapavičiaus pr. 31-7, Kaunas" },
    //   klaipeda: { address: "Liepų g. 83, Klaipėda" },
    // },
    url: "https://solido.lt/",
  },
  {
    id: "linea",
    name: "Linea",
    surfaceCategories: ["tiles"],
    isPartner: false,
    locations: {
      vilnius: { address: "Kęstučio g. 53, Vilnius" },
      kaunas: { address: "Savanorių pr. 170, Kaunas" },
      klaipeda: { address: "Taikos pr. 56, Klaipėda (HELIOS Galerija)" },
    },
    url: "https://linea.lt/",
  },
];
