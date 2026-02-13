const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface SupabaseResponse<T> {
    data: T | null;
    error: any | null;
}

class SupabaseClient {
    private baseUrl: string;
    private anonKey: string;

    constructor(url: string, key: string) {
        this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        this.anonKey = key;
    }

    from(table: string) {
        return new QueryBuilder(this.baseUrl, this.anonKey, table);
    }
}

class QueryBuilder {
    private url: string;
    private key: string;
    private table: string;
    private queryParams: URLSearchParams;
    private headers: HeadersInit;

    constructor(baseUrl: string, key: string, table: string) {
        this.url = `${baseUrl}/rest/v1/${table}`;
        this.key = key;
        this.table = table;
        this.queryParams = new URLSearchParams();

        // Fallback: Some configurations prefer apikey in query params
        this.queryParams.set('apikey', this.key);

        this.headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
        };

        if (typeof window !== 'undefined') {
            const maskedKey = this.key ? `${this.key.substring(0, 5)}...${this.key.substring(this.key.length - 5)}` : "MISSING";
            console.log(`[Supabase DEBUG] Initializing ${table} fetch. Key: ${maskedKey}, URL: ${this.url}`);
        }
    }

    select(columns: string = '*') {
        this.queryParams.set('select', columns);
        return this;
    }

    eq(column: string, value: any) {
        this.queryParams.set(column, `eq.${value}`);
        return this;
    }

    async maybeSingle(): Promise<SupabaseResponse<any>> {
        const qs = this.queryParams.toString();
        const fullUrl = qs ? `${this.url}?${qs}` : this.url;
        try {
            const res = await fetch(fullUrl, {
                method: 'GET',
                headers: this.headers,
            });

            const text = await res.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                console.error("Failed to parse Supabase JSON response:", text);
                return { data: null, error: { message: "Invalid JSON response", status: res.status, body: text } };
            }

            if (!res.ok) {
                return { data: null, error: data || { message: "Request failed", status: res.status } };
            }

            // data is expected to be an array for normal GET requests
            const result = Array.isArray(data) ? (data[0] || null) : data;

            // If data is null but we used .single() or expected one, store.ts checks for error code
            if (result === null) {
                return { data: null, error: null }; // Returning null data is fine
            }

            return { data: result, error: null };
        } catch (error) {
            console.error("Supabase network error for URL:", fullUrl, error);
            return { data: null, error };
        }
    }

    async insert(values: any | any[]): Promise<SupabaseResponse<any>> {
        try {
            const res = await fetch(`${this.url}`, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify(values),
            });

            const text = await res.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                return { data: null, error: { message: "Invalid JSON response", status: res.status, body: text } };
            }

            if (!res.ok) return { data: null, error: data || { message: "Request failed", status: res.status } };
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async upsert(values: any | any[], options?: { onConflict?: string }): Promise<SupabaseResponse<any>> {
        const prefer = ['return=representation', 'resolution=merge-duplicates'];
        if (options?.onConflict) {
            this.queryParams.set('on_conflict', options.onConflict);
        }
        const qs = this.queryParams.toString();
        const fullUrl = qs ? `${this.url}?${qs}` : this.url;

        try {
            const res = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Prefer': prefer.join(','),
                },
                body: JSON.stringify(values),
            });

            const text = await res.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                return { data: null, error: { message: "Invalid JSON response", status: res.status, body: text } };
            }

            if (!res.ok) return { data: null, error: data || { message: "Request failed", status: res.status } };
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async single(): Promise<SupabaseResponse<any>> {
        return this.maybeSingle();
    }

    async delete(): Promise<SupabaseResponse<any>> {
        const qs = this.queryParams.toString();
        const fullUrl = qs ? `${this.url}?${qs}` : this.url;
        try {
            const res = await fetch(fullUrl, {
                method: 'DELETE',
                headers: this.headers,
            });

            if (res.status === 204 || res.status === 200) return { data: null, error: null };

            const text = await res.text();
            let error = { message: "Delete failed", status: res.status };
            try {
                error = text ? JSON.parse(text) : error;
            } catch (e) { }

            return { data: null, error };
        } catch (error) {
            return { data: null, error };
        }
    }

    async selectAll(): Promise<SupabaseResponse<any[]>> {
        const qs = this.queryParams.toString();
        const fullUrl = qs ? `${this.url}?${qs}` : this.url;
        try {
            const res = await fetch(fullUrl, {
                method: 'GET',
                headers: this.headers,
            });

            const text = await res.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                console.error("Failed to parse Supabase JSON response:", text);
                return { data: null, error: { message: "Invalid JSON response", status: res.status, body: text } };
            }

            if (!res.ok) {
                return { data: null, error: data || { message: "Request failed", status: res.status } };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Supabase network error for URL:", fullUrl, error);
            return { data: null, error };
        }
    }
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
    ? new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : (() => {
        console.warn("Supabase client not initialized: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
        return null;
    })();
