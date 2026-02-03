export type InstanceKey = "Technology" | "Colleague" | "Security" | "Customer" | "Supplier";
export type EnvironmentKey = "PPE" | "PROD";

export interface ZendeskCreds {
  subdomain: string;
  email: string;
  token: string;
}

// Helper to read env variables. Prefixes follow VITE_<INSTANCE>_<ENV>_*
const read = (key: string) => import.meta.env[key] || "";

const INSTANCES: Record<InstanceKey, Record<EnvironmentKey, ZendeskCreds>> = {
  Technology: {
    PPE: {
      subdomain: read("VITE_TECHNOLOGY_PPE_SUBDOMAIN"),
      email: read("VITE_TECHNOLOGY_PPE_EMAIL"),
      token: read("VITE_TECHNOLOGY_PPE_TOKEN"),
    },
    PROD: {
      subdomain: read("VITE_TECHNOLOGY_PROD_SUBDOMAIN"),
      email: read("VITE_TECHNOLOGY_PROD_EMAIL"),
      token: read("VITE_TECHNOLOGY_PROD_TOKEN"),
    },
  },
  Colleague: {
    PPE: {
      subdomain: read("VITE_COLLEAGUE_PPE_SUBDOMAIN"),
      email: read("VITE_COLLEAGUE_PPE_EMAIL"),
      token: read("VITE_COLLEAGUE_PPE_TOKEN"),
    },
    PROD: {
      subdomain: read("VITE_COLLEAGUE_PROD_SUBDOMAIN"),
      email: read("VITE_COLLEAGUE_PROD_EMAIL"),
      token: read("VITE_COLLEAGUE_PROD_TOKEN"),
    },
  },
  Security: {
    PPE: {
      subdomain: read("VITE_SECURITY_PPE_SUBDOMAIN"),
      email: read("VITE_SECURITY_PPE_EMAIL"),
      token: read("VITE_SECURITY_PPE_TOKEN"),
    },
    PROD: {
      subdomain: read("VITE_SECURITY_PROD_SUBDOMAIN"),
      email: read("VITE_SECURITY_PROD_EMAIL"),
      token: read("VITE_SECURITY_PROD_TOKEN"),
    },
  },
  Customer: {
    PPE: {
      subdomain: read("VITE_CUSTOMER_PPE_SUBDOMAIN"),
      email: read("VITE_CUSTOMER_PPE_EMAIL"),
      token: read("VITE_CUSTOMER_PPE_TOKEN"),
    },
    PROD: {
      subdomain: read("VITE_CUSTOMER_PROD_SUBDOMAIN"),
      email: read("VITE_CUSTOMER_PROD_EMAIL"),
      token: read("VITE_CUSTOMER_PROD_TOKEN"),
    },
  },
  Supplier: {
    PPE: {
      subdomain: read("VITE_SUPPLIER_PPE_SUBDOMAIN"),
      email: read("VITE_SUPPLIER_PPE_EMAIL"),
      token: read("VITE_SUPPLIER_PPE_TOKEN"),
    },
    PROD: {
      subdomain: read("VITE_SUPPLIER_PROD_SUBDOMAIN"),
      email: read("VITE_SUPPLIER_PROD_EMAIL"),
      token: read("VITE_SUPPLIER_PROD_TOKEN"),
    },
  },
};

export default INSTANCES;