package com.stok.app.filter;

import io.github.bucket4j.Bucket;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RateLimitFilter implements Filter {

    private final Bucket bucket;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Skip rate limiting for static resources if needed, or specific internal
        // endpoints
        // For now, applying to all API endpoints
        if (httpRequest.getRequestURI().startsWith("/api") || httpRequest.getRequestURI().startsWith("/stocks")
                || httpRequest.getRequestURI().startsWith("/auth")) {
            if (bucket.tryConsume(1)) {
                chain.doFilter(request, response);
            } else {
                httpResponse.setStatus(429);
                httpResponse.getWriter().write("Too many requests");
            }
        } else {
            chain.doFilter(request, response);
        }
    }
}
